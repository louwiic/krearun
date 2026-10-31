import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as events from '../lib/product-events.ts';
const require=createRequire(import.meta.url);
function load(path,mocks={}){const {outputText}=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}});const mod={exports:{}};new Function('require','module','exports',outputText)(name=>mocks[name]??require(name),mod,mod.exports);return mod.exports;}
const payload={eventId:'ade039c6-b799-4dd8-8ac5-4606759dcb1d',productId:'abc123def456ghi',kind:'view',consent:true};
test('event validation accepts only supported product IDs, consent and actions and drops extra personal data',()=>{
 assert.deepEqual(events.parseProductEvent({...payload,email:'secret@example.invalid',url:'/private?token=secret'}),{eventId:payload.eventId,productId:payload.productId,kind:'view'});
 for(const patch of [{consent:false},{consent:undefined},{kind:'order'},{productId:"x' || true"},{eventId:'not-a-uuid'}])assert.equal(events.parseProductEvent({...payload,...patch}),null);
});
test('period and product filters aggregate accurate daily metrics across Reunion midnight',()=>{
 assert.equal(events.productDay(new Date('2026-10-26T21:00:00Z')),'2026-10-27');
 const rows=[{productId:'a',day:'2026-10-01',impressions:10,clicks:2,views:3},{productId:'a',day:'2026-10-27',impressions:5,clicks:1,views:2},{productId:'b',day:'2026-10-27',impressions:20,clicks:4,views:8}];
 const result=events.productCounts(rows,'2026-10-02','2026-10-27');
 assert.deepEqual(result.total,{impressions:25,clicks:5,views:10});assert.equal(result.byProduct.a.views,2);
 assert.deepEqual(events.productCounts(rows,'2026-10-02','2026-10-27','a').total,{impressions:5,clicks:1,views:2});
 assert.equal(events.shiftProductDay('2026-10-27',-29),'2026-09-28');
});
test('public ingestion rejects cross-origin, malformed and oversized requests; excludes admin and bots',async()=>{
 let admin=false,writes=0;
 const {POST}=load('../app/api/product-events/route.ts',{'@/lib/auth':{isAdmin:async()=>admin},'@/lib/product-events':events,'@/lib/clicker':{CLICKER_PRODUCT_ID:'clicker-studio'},'@/lib/store':{getProductById:async()=>({active:true}),recordProductEvent:async()=>writes++}});
 const request=(body=payload,headers={})=>new Request('https://krearun.re/api/product-events',{method:'POST',body:JSON.stringify(body),headers:{'content-type':'application/json',...headers}});
 assert.equal((await POST(request(payload,{origin:'https://other.invalid'}))).status,403);
 assert.equal((await POST(request({kind:'bad'}))).status,400);
 assert.equal((await POST(request({padding:'a'.repeat(1100)}))).status,413);
 admin=true;assert.equal((await POST(request())).status,204);admin=false;
 assert.equal((await POST(request(payload,{'user-agent':'Googlebot'}))).status,204);assert.equal(writes,0);
 assert.equal((await POST(request())).status,202);assert.equal(writes,1);
});
test('the client sends nothing before consent, retries with the same ID and deduplicates refreshes in one tab',async()=>{
 let consent=false,calls=[];
 const original={window:global.window,document:global.document,sessionStorage:global.sessionStorage,fetch:global.fetch};
 const storage=new Map();global.window={};global.document={visibilityState:'visible'};global.sessionStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
 global.fetch=async(url,options)=>{calls.push(JSON.parse(options.body));return {ok:calls.length>1,status:calls.length===1?503:202};};
 const mocks={'./privacy':{hasAudienceConsent:()=>consent},'./product-events':events};
 try{
  const client=load('../lib/product-tracking.ts',mocks);
  client.trackProductEvent(payload.productId,'view');await new Promise(r=>setImmediate(r));assert.equal(calls.length,0);assert.equal(storage.size,0);
  consent=true;client.trackProductEvent(payload.productId,'view');await new Promise(r=>setImmediate(r));assert.equal(calls.length,2);assert.equal(calls[0].eventId,calls[1].eventId);
  client.trackProductEvent(payload.productId,'view');await new Promise(r=>setImmediate(r));assert.equal(calls.length,2);
  const refreshed=load('../lib/product-tracking.ts',mocks);refreshed.trackProductEvent(payload.productId,'view');await new Promise(r=>setImmediate(r));assert.equal(calls.length,2);
  global.document.visibilityState='hidden';client.trackProductEvent(payload.productId,'click');assert.equal(calls.length,2);
  consent=false;client.clearProductTracking();assert.equal(storage.size,0);
 }finally{for(const [key,value] of Object.entries(original)){if(value===undefined)delete global[key];else global[key]=value;}}
});
test('event persistence handles simultaneous retries without double counting',async()=>{
 const source=ts.createSourceFile('store.ts',readFileSync(new URL('../lib/store.ts',import.meta.url),'utf8'),ts.ScriptTarget.Latest,true);
 const fn=source.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='recordProductEvent');
 const {outputText}=ts.transpileModule(fn.getText(source),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 const mod={exports:{}};let exists=false,creates=0;
 new Function('module','exports','pb',outputText)(mod,mod.exports,async(path,options)=>{if(!options)return {items:exists?[{id:'saved'}]:[]};creates++;if(exists)throw Error('unique constraint');exists=true;return {id:'saved'};});
 await Promise.all([mod.exports.recordProductEvent(events.parseProductEvent(payload)),mod.exports.recordProductEvent(events.parseProductEvent(payload))]);
 assert.ok(creates>=1);assert.equal(exists,true);
 await mod.exports.recordProductEvent(events.parseProductEvent(payload));const before=creates;await mod.exports.recordProductEvent(events.parseProductEvent(payload));assert.equal(creates,before);
});
test('the admin report shows real zero totals and a clear unavailable state',()=>{
 const Panel=load('../components/admin/ProductAudience.tsx',{'next/link':({children,...props})=>createElement('a',props,children),'@/lib/product-events':events}).default;
 const props={today:'2026-10-27',products:[{id:'a',name:'NOS 500 ml'}]};
 const empty=renderToStaticMarkup(createElement(Panel,{...props,rows:[]}));assert.ok(empty.includes('NOS 500 ml'));assert.ok(empty.includes('Aucune activité mesurée'));assert.ok(empty.includes('Vues des fiches'));
 const unavailable=renderToStaticMarkup(createElement(Panel,{...props,rows:null}));assert.ok(unavailable.includes('temporairement indisponibles'));assert.ok(!unavailable.includes('Aucune activité mesurée'));
});

test('impressions need one second of visible exposure and consent withdrawal cancels pending observations',async()=>{
 const originals={window:global.window,document:global.document,IntersectionObserver:global.IntersectionObserver,MutationObserver:global.MutationObserver,Element:global.Element};
 let consent=false,cleanup,observer,calls=[],clears=0;const listeners=new Map();
 const card={isConnected:true,hasAttribute:()=>false,getAttribute:()=>payload.productId};
 const instances=[];
 class Observer{constructor(callback){this.callback=callback;instances.push(this);}observe(){}unobserve(){}disconnect(){}}
 class Mutations{observe(){}disconnect(){}}
 const win=new EventTarget();win.IntersectionObserver=Observer;
 global.window=win;global.IntersectionObserver=Observer;global.MutationObserver=Mutations;
 global.document={visibilityState:'visible',body:{},querySelectorAll:()=>[card],addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
 global.Element=class{closest(){return {getAttribute:()=>payload.productId};}};
 try{
  const Tracker=load('../components/analytics/ProductTracking.tsx',{'@/lib/journey-tracking':{trackJourney:()=>{}},'react':{useEffect:setup=>{cleanup=setup();}},'next/navigation':{usePathname:()=>'/boutique'},'@/lib/privacy':{hasAudienceConsent:()=>consent},'@/lib/product-tracking':{trackProductEvent:(...args)=>calls.push(args),clearProductTracking:()=>clears++}}).default;
  Tracker();assert.equal(observer,undefined);
  consent=true;win.dispatchEvent(new Event('krearun:privacy-change'));observer=instances.at(-1);assert.ok(observer);
  observer.callback([{target:card,isIntersecting:true,intersectionRatio:.5}]);
  observer.callback([{target:card,isIntersecting:false,intersectionRatio:0}]);
  await new Promise(r=>setTimeout(r,1050));assert.equal(calls.length,0);
  observer.callback([{target:card,isIntersecting:true,intersectionRatio:.5}]);
  await new Promise(r=>setTimeout(r,1050));assert.deepEqual(calls,[[payload.productId,'impression']]);
  listeners.get('click')({button:0,target:new global.Element()});assert.equal(calls.at(-1)[1],'click');
  const before=calls.length;observer.callback([{target:card,isIntersecting:true,intersectionRatio:1}]);
  consent=false;win.dispatchEvent(new Event('krearun:privacy-change'));
  await new Promise(r=>setTimeout(r,1050));assert.equal(calls.length,before);assert.ok(clears>0);
 }finally{cleanup?.();for(const [key,value] of Object.entries(originals)){if(value===undefined)delete global[key];else global[key]=value;}}
});
