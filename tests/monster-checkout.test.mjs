import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import * as gift from '../lib/monster-gift.ts';
import * as metadata from '../lib/checkout-item-metadata.ts';
import * as legal from '../lib/legal.ts';
const require=createRequire(import.meta.url);
function checkout(slug='porte-canette-monster') {
 const sessions=[];
 const mocks={
  '@/lib/monster-gift':gift,'@/lib/legal':legal,'@/lib/checkout-item-metadata':metadata,
  '@/lib/store':{getSettings:async()=>({}),getProductById:async()=>({id:'monster',slug,name:'Produit',active:true,variants:[],stock:10,priceCents:1790,weightGrams:180,images:[]})},
  '@/lib/stripe':{stripeConfigured:()=>true,getStripe:()=>({checkout:{sessions:{create:async data=>{sessions.push(data);return {url:'https://checkout.invalid/test'};}}}})},
  '@/lib/colors':{publicColorName:v=>v},'@/lib/free-shipping':{billableProductWeight:()=>180,hasMissingProductWeight:()=>false},
  '@/lib/shipping':{parseShippingRates:()=>[],calculateShippingCents:()=>({priceCents:577,label:'Test'})},
  '@/lib/pickup':{getPickupPoint:()=>null},'@/lib/quantity-discounts':{discountedUnitPriceCents:p=>p},
  '@/lib/clicker':{CLICKER_PRODUCT_ID:'clicker'},'@/lib/custom-holder':{HOLDER_SLUG:'holder'},
  '@/lib/lamp-personalization':{isPersonalizedLamp:()=>false},
 };
 const source=readFileSync(new URL('../app/api/checkout/route.ts',import.meta.url),'utf8');
 const {outputText}=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
 const compiled={exports:{}};new Function('require','module','exports',outputText)(name=>mocks[name]??require(name),compiled,compiled.exports);
 return {sessions,post:compiled.exports.POST};
}
function request(extra={},terms=true) {return new Request('https://krearun.re/api/checkout',{method:'POST',body:JSON.stringify({termsAccepted:terms,termsVersion:legal.LEGAL_VERSION,items:[{productId:'monster',quantity:1,color:'Blanc',...extra}],customer:{email:'test@example.invalid',firstName:'Test',lastName:'Client',phone:'0000000000',addressLine1:'Test',postalCode:'97430',city:'Test',country:'RE'}})});}
test('Monster gift is included without a selector and replaces stale cart choices at checkout',async()=>{
 for(const value of [undefined,'1','2','forged']) {const {sessions,post}=checkout();const response=await post(request({keychainChoice:value}));assert.equal(response.status,200);const packed=JSON.parse(metadata.readCheckoutItems(sessions[0].metadata));assert.equal(packed[0].k,gift.MONSTER_GIFT);assert.match(sessions[0].line_items[0].price_data.product_data.name,/Porte-clés griffes — Blanc/);assert.equal(sessions[0].line_items[0].price_data.unit_amount,1790);}
});
test('a gift cannot be added to another product by the browser',async()=>{const {sessions,post}=checkout('other');assert.equal((await post(request({keychainChoice:gift.MONSTER_GIFT}))).status,200);assert.equal(JSON.parse(metadata.readCheckoutItems(sessions[0].metadata))[0].k,undefined);});
test('checkout rejects missing consent before creating a payment session',async()=>{const {sessions,post}=checkout();assert.equal((await post(request({},false))).status,400);assert.equal(sessions.length,0);});
