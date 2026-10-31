import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { parseJourneyEvent, purchaseJourneys } from '../lib/purchase-journey.ts';
const require=createRequire(import.meta.url);
const sessionId='cde280a5-c1c3-424b-ae28-a1130111fbbc',eventId='4a33c65e-6b4f-4caf-bb10-930d183fdd85',productId='abcdefghijklmno';
const base={sessionId,eventId,kind:'view_cart',consent:true,items:[{productId,quantity:2}]};
function load(path,mocks){const out=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;const mod={exports:{}};new Function('require','module','exports',out)(n=>mocks[n]??require(n),mod,mod.exports);return mod.exports;}
test('consent is required and client data cannot fake purchase, date, price or customer identity',()=>{
 assert.equal(parseJourneyEvent({...base,consent:false}),null);
 assert.equal(parseJourneyEvent({...base,kind:'payment_started'}),null);
 assert.equal(parseJourneyEvent({...base,kind:'purchase'}),null);
 assert.equal(parseJourneyEvent({...base,sessionId:'email@example.fr'}),null);
 const parsed=parseJourneyEvent({...base,email:'private@example.fr',checkoutId:'fake',created:'1999-01-01',items:[{productId,quantity:2,name:'secret name',customName:'LOIC',unitPriceCents:1,color:'private'}]});
 assert.deepEqual(parsed,{eventId,sessionId,kind:'view_cart',items:[{productId,quantity:2}]});
 assert.equal(parseJourneyEvent({...base,items:[{productId,quantity:-1}]}),null);
 assert.equal(parseJourneyEvent({...base,items:Array(31).fill(base.items[0])}),null);
});
const now=Date.parse('2026-10-31T08:00:00Z');
const row=(kind,minutes,items=base.items,extra={})=>({eventId:crypto.randomUUID(),sessionId,kind,items,created:new Date(now-minutes*60000).toISOString(),...extra});
test('abandoned baskets require a nonempty cart, a cart visit and 30 minutes of inactivity',()=>{
 assert.equal(purchaseJourneys([row('add_to_cart',40)],new Set(),now)[0].status,'browsing');
 assert.equal(purchaseJourneys([row('view_cart',29)],new Set(),now)[0].status,'active_cart');
 assert.equal(purchaseJourneys([row('view_cart',30)],new Set(),now)[0].status,'abandoned');
 assert.equal(purchaseJourneys([row('view_cart',40),row('cart_updated',35,[])],new Set(),now)[0].status,'browsing');
});
test('later product views do not erase a cart and paid checkouts cannot remain abandoned',()=>{
 const rows=[row('view_cart',45,[{...base.items[0],unitPriceCents:1500}]),row('payment_started',40,base.items,{checkoutId:'cs_paid'}),row('product_view',35,[],{productId})];
 assert.equal(purchaseJourneys(rows,new Set(['cs_paid']),now)[0].status,'paid');
 assert.equal(purchaseJourneys(rows,new Set(),now)[0].items.length,1);
 assert.equal(purchaseJourneys([row('view_cart',40,[{...base.items[0],unitPriceCents:1500}])],new Set(),now)[0].estimatedCents,3000);
});
test('event endpoint rejects cross-origin, server-only events, oversized and invalid product snapshots',async()=>{
 let writes=0,admin=false;
 const api=load('../app/api/purchase-events/route.ts',{'@/lib/auth':{isAdmin:async()=>admin},'@/lib/purchase-journey':{parseJourneyEvent},'@/lib/seo':{siteOrigin:()=> 'https://krearun.re'},'@/lib/clicker':{CLICKER_PRODUCT_ID:'clicker-studio'},'@/lib/store':{getProductById:async id=>id===productId?{id,active:true,name:'Valid product',priceCents:2000,variants:[]}:null,recordPurchaseEvent:async e=>{writes++;assert.equal(e.items[0].unitPriceCents,2000);}}});
 const req=(v,origin='https://krearun.re',extra={})=>new Request('https://krearun.re/api/purchase-events',{method:'POST',headers:{origin,'Content-Type':'application/json',...extra},body:JSON.stringify(v)});
 assert.equal((await api.POST(req(base,'https://evil.example'))).status,403);
 assert.equal((await api.POST(req({...base,kind:'payment_started'}))).status,400);
 assert.equal((await api.POST(req({...base,items:[{productId:'nonexistent1234',quantity:1}]}))).status,400);
 assert.equal((await api.POST(req(base,undefined,{'content-length':'9000'}))).status,413);
 assert.equal((await api.POST(req(base))).status,202);assert.equal(writes,1);
 admin=true;assert.equal((await api.POST(req(base))).status,204);assert.equal(writes,1);
});
test('browser payload contains no personalization or email and storage corruption cannot break checkout',async()=>{
 const calls=[];let consent=false;const storage=new Map();
 const old={window:globalThis.window,document:globalThis.document,sessionStorage:globalThis.sessionStorage,fetch:globalThis.fetch};
 globalThis.window={};globalThis.document={visibilityState:'visible'};globalThis.sessionStorage={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)};
 globalThis.fetch=async(url,options)=>{calls.push(JSON.parse(options.body));return {ok:true};};
 try {
  const client=load('../lib/journey-tracking.ts',{'./privacy':{hasAudienceConsent:()=>consent},'./purchase-journey':{UUID:/^[a-f0-9-]{36}$/i}});
  assert.equal(client.journeySessionId(),undefined);client.trackJourney('view_cart',[]);assert.equal(calls.length,0);
  consent=true;storage.set('krearun:purchase-session:v1',JSON.stringify('broken'));
  const id=client.journeySessionId();assert.match(id,/^[a-f0-9-]{36}$/i);
  client.trackJourney('view_cart',[{productId,quantity:1,customName:'PRIVATE',name:'Private email@example.fr',unitPriceCents:5}]);
  await new Promise(r=>setTimeout(r,0));assert.equal(calls.length,1);assert.deepEqual(calls[0].items,[{productId,quantity:1}]);
  consent=false;client.clearJourneyTracking();assert.equal(storage.size,0);assert.equal(client.journeySessionId(),undefined);
 } finally {Object.assign(globalThis,old);}
});

test('navigation page types cannot contain raw URLs or contact details',()=>{
 const valid=parseJourneyEvent({...base,page:'cart'});assert.equal(valid.page,'cart');
 assert.equal(parseJourneyEvent({...base,page:'/compte?email=private@example.fr'}),null);
});
