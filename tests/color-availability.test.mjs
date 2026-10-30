import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as availability from '../lib/color-availability.ts';
const require=createRequire(import.meta.url);
function load(path,mocks={}){const {outputText}=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}});const mod={exports:{}};new Function('require','module','exports',outputText)(name=>mocks[name]??require(name),mod,mod.exports);return mod.exports;}
const inventory=[{name:'Vert Neon',hex:'#d5ff3d',active:false},{name:'PLA Rouge',hex:'#e00000',active:true}];
test('inventory matching handles PLA prefixes, accents, aliases and duplicate spools',()=>{
 assert.equal(availability.inventoryColorAvailable({name:'PLA Vert néon',hex:'#a3ff00'},inventory),false);
 assert.equal(availability.inventoryColorAvailable({name:'alias green',hex:'#D5FF3D'},inventory),false);
 assert.equal(availability.inventoryColorAvailable({name:'Rouge',hex:'#e00000'},inventory),true);
 assert.equal(availability.inventoryColorAvailable({name:'unknown',hex:'#123456'},inventory),true);
 assert.equal(availability.inventoryColorAvailable({name:'Vert Neon',hex:'#d5ff3d'},[...inventory,{...inventory[0],active:true}]),true);
});
test('unavailable product colours are crossed out and disabled; initial selection falls back to an available colour',()=>{
 const provider=load('../components/product/ColorAvailabilityProvider.tsx',{'@/lib/color-availability':availability});
 const Add=load('../components/product/AddToCart.tsx',{
 './ColorAvailabilityProvider':provider,'@/components/cart/CartContext':{useCart:()=>({addItem(){}})},
 './NosPersonalization':()=>null,'@/lib/nos':{},'@/lib/monster-gift':{},'@/lib/nos-preview':{},'next/link':()=>null,'@/lib/custom-holder':{},'@/lib/colors':{publicColorName:v=>v},'@/lib/format':{formatPrice:v=>String(v)},'./LampPersonalization':()=>null,'@/lib/lamp-personalization':{isPersonalizedLamp:()=>false,buildLampPersonalization:()=>''},'./MonsterGiftPreview':()=>null,'./MonsterClawPreview':()=>null,'@/lib/quantity-discounts':{quantityDiscountPercent:()=>0,discountedUnitPriceCents:v=>v}
 }).default;
 const product={id:'test',slug:'test',category:'porte-boisson',colors:inventory.map(({name,hex})=>({name,hex})),variants:[],images:[],priceCents:1790,stock:10,quantityDiscounts:[]};
 const html=renderToStaticMarkup(createElement(provider.ColorAvailabilityProvider,{colors:inventory},createElement(Add,{product})));
 assert.match(html,/disabled=""[^>]*title="Vert Neon — Rupture de stock"/);
 assert.ok(html.includes('color-swatch-unavailable'));assert.ok(html.includes('Coloris barrés : rupture de stock.'));
 assert.match(html,/Coloris — <span[^>]*>PLA Rouge/);
 const empty=renderToStaticMarkup(createElement(provider.ColorAvailabilityProvider,{colors:inventory.map(c=>({...c,active:false}))},createElement(Add,{product})));
 assert.match(empty,/disabled=""[^>]*>Coloris en rupture de stock/);
});
test('inventory writes emit success only after persistence, and refresh storefront availability',async()=>{
 const source=ts.createSourceFile('actions.ts',readFileSync(new URL('../app/admin/actions.ts',import.meta.url),'utf8'),ts.ScriptTarget.Latest,true);
 const fn=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='saveInventoryColorAction');
 const {outputText}=ts.transpileModule(fn.getText(source),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
 let saved={id:'color'},admin=true;const notices=[],invalidations=[],writes=[];const mod={exports:{}};
 new Function('module','exports','requireAdmin','updateInventoryColor','createInventoryColor','setAdminNotice','revalidatePath','redirect',outputText)(mod,mod.exports,async()=>{if(!admin)throw Error('unauthorized');},async(id,data)=>{writes.push(data);return saved;},async data=>{writes.push(data);return saved;},async(kind,message)=>notices.push({kind,message}),(...args)=>invalidations.push(args),()=>{throw Error('redirect');});
 const form=new FormData();for(const [key,value]of Object.entries({id:'color',name:'Vert Neon',hex:'#d5ff3d',stockGrams:'0',sortOrder:'0'}))form.set(key,value);
 await assert.rejects(mod.exports.saveInventoryColorAction(form),/redirect/);assert.equal(writes[0].active,false);assert.equal(notices.at(-1).kind,'success');assert.ok(invalidations.some(([path,type])=>path==='/'&&type==='layout'));
 saved=null;await assert.rejects(mod.exports.saveInventoryColorAction(form),/redirect/);assert.equal(notices.at(-1).kind,'error');
 admin=false;const count=writes.length;await assert.rejects(mod.exports.saveInventoryColorAction(form),/unauthorized/);assert.equal(writes.length,count);
});
