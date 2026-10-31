import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import * as metropolitan from '../lib/metropolitan-shipping.ts';
import * as gift from '../lib/monster-gift.ts';
import * as metadata from '../lib/checkout-item-metadata.ts';
import * as legal from '../lib/legal.ts';
import * as nos from '../lib/nos.ts';
import * as availability from '../lib/color-availability.ts';
import * as promotionDetails from '../lib/promotion-details.ts';
const require=createRequire(import.meta.url);
function checkout(slug='porte-canette-monster',weightGrams=180, settings={}, productOverrides={}, inventory=[], promotion=null) {
 const sessions=[];
 const mocks={
  "@/lib/auth":{isAdmin:async()=>false},
  "@/lib/purchase-journey":{UUID:/^[0-9a-f-]{36}$/i},
  '@/lib/promotion-details':promotionDetails,'@/lib/color-availability':availability,'@/lib/metropolitan-shipping':metropolitan,'@/lib/nos':nos,
  '@/lib/monster-gift':gift,'@/lib/legal':legal,'@/lib/checkout-item-metadata':metadata,
  '@/lib/store':{getInventoryColors:async()=>inventory,getNosLogo:async id=>id==='abc123def456ghi'?{id}:null,getSettings:async()=>settings,getProductById:async()=>({id:'monster',slug,name:'Produit',active:true,variants:[],stock:10,priceCents:1790,weightGrams,images:[],colors:slug===nos.NOS_SLUG?nos.NOS_COLORS:[],...productOverrides})},
  '@/lib/stripe':{stripeConfigured:()=>true,getStripe:()=>({promotionCodes:{list:async()=>({data:promotion?[promotion]:[]})},checkout:{sessions:{create:async data=>{sessions.push(data);return {url:'https://checkout.invalid/test'};}}}})},
  '@/lib/colors':{publicColorName:v=>v},'@/lib/free-shipping':{billableProductWeight:()=>weightGrams,hasMissingProductWeight:()=>weightGrams<=0},
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
function request(extra={},terms=true,customer={},body={}) {return new Request('https://krearun.re/api/checkout',{method:'POST',body:JSON.stringify({termsAccepted:terms,termsVersion:legal.LEGAL_VERSION,items:[{productId:'monster',quantity:1,color:'Blanc',...extra}],customer:{email:'test@example.invalid',firstName:'Test',lastName:'Client',phone:'0000000000',addressLine1:'Test',postalCode:'97430',city:'Test',country:'RE',...customer},...body})});}
test('Monster gift is included without a selector and replaces stale cart choices at checkout',async()=>{
 for(const value of [undefined,'1','2','forged']) {const {sessions,post}=checkout();const response=await post(request({keychainChoice:value}));assert.equal(response.status,200);const packed=JSON.parse(metadata.readCheckoutItems(sessions[0].metadata));assert.equal(packed[0].k,gift.MONSTER_GIFT);assert.match(sessions[0].line_items[0].price_data.product_data.name,/Porte-clés griffes — Blanc/);assert.equal(sessions[0].line_items[0].price_data.unit_amount,1790);}
});
test('a gift cannot be added to another product by the browser',async()=>{const {sessions,post}=checkout('other');assert.equal((await post(request({keychainChoice:gift.MONSTER_GIFT}))).status,200);assert.equal(JSON.parse(metadata.readCheckoutItems(sessions[0].metadata))[0].k,undefined);});
test('checkout rejects missing consent before creating a payment session',async()=>{const {sessions,post}=checkout();assert.equal((await post(request({},false))).status,400);assert.equal(sessions.length,0);});

test('mainland delivery uses the server parcel weight and preserves the quote in Stripe metadata',async()=>{
 const {sessions,post}=checkout('porte-canette-monster',501);
 assert.equal((await post(request({shippingCents:1},true,{country:'FR',postalCode:'75001'}))).status,200);
 assert.equal(sessions[0].shipping_options[0].shipping_rate_data.fixed_amount.amount,1646);
 const quote=metropolitan.readShippingQuote(sessions[0].metadata);
 assert.equal(quote.weightGrams,501);assert.equal(quote.baseCents,1646);assert.equal(quote.mode,'without_signature');
});
test('mainland parcels above 30 kg, missing weights and other overseas destinations never create payment sessions',async()=>{
 for(const [weight,postalCode,country] of [[30001,'75001','FR'],[0,'75001','FR'],[180,'97200','FR'],[180,'75001','BE']]) {
  const {sessions,post}=checkout('porte-canette-monster',weight);
  assert.equal((await post(request({},true,{country,postalCode}))).status,400);assert.equal(sessions.length,0);
 }
});


test('unlisted offers charge the saved price and reject deactivated or exhausted offers',async()=>{
 const product={privateSale:true,priceCents:4590,stock:1};
 const {sessions,post}=checkout('creation-unique-opaque-token',600,{},product);
 assert.equal((await post(request({priceCents:1,unitPriceCents:1,quantity:1}))).status,200);
 assert.equal(sessions[0].line_items[0].price_data.unit_amount,4590);
 for(const overrides of [{active:false},{stock:0}]) {
  const closed=checkout('creation-unique-opaque-token',600,{}, {...product,...overrides});
  assert.equal((await closed.post(request())).status,400);
  assert.equal(closed.sessions.length,0);
 }
});


test('NOS preserves a verified logo reference in the order and charges its saved personalization price',async()=>{
 const {sessions,post}=checkout(nos.NOS_SLUG,185,{}, {priceCents:2290,namePersonalizationEnabled:true,namePersonalizationPriceCents:0});
 assert.equal((await post(request({customName:'Logo : abc123def456ghi'}))).status,200);
 const items=JSON.parse(metadata.readCheckoutItems(sessions[0].metadata));
 assert.equal(items[0].n,'Logo : abc123def456ghi');assert.equal(sessions[0].line_items[0].price_data.unit_amount,2290);
 const invalid=checkout(nos.NOS_SLUG,185,{}, {namePersonalizationEnabled:true});
 assert.equal((await invalid.post(request({customName:'Logo : xyz123def456ghi'}))).status,400);
 assert.equal(invalid.sessions.length,0);
});


test('NOS keeps the complete custom text and the selected black, pink or white color in the order',async()=>{
 const customName='Toujours à fond avec mon porte-boisson personnalisé !';
 for(const color of ['Noir','Rose','Blanc']) {
  const {sessions,post}=checkout(nos.NOS_SLUG,185,{}, {priceCents:2290,namePersonalizationEnabled:true,namePersonalizationPriceCents:0});
  assert.equal((await post(request({customName,color}))).status,200);
  const items=JSON.parse(metadata.readCheckoutItems(sessions[0].metadata));
  assert.equal(items[0].n,customName);assert.equal(items[0].c,color);
  assert.equal(sessions[0].line_items[0].price_data.unit_amount,2290);
 }
});
test('NOS rejects an unavailable color or text longer than 60 characters before taking payment',async()=>{
 for(const values of [{color:'Bleu'},{color:'Rose',customName:'a'.repeat(61)}]) {
  const {sessions,post}=checkout(nos.NOS_SLUG,185,{}, {namePersonalizationEnabled:true});
  assert.equal((await post(request(values))).status,400);assert.equal(sessions.length,0);
 }
});

test('checkout refuses a stale unavailable filament choice before creating a payment session', async () => {
 const inventory = [{name:'Vert Neon',hex:'#d5ff3d',active:false}];
 const closed=checkout('porte-canette-monster',180,{}, {colors:[{name:'Vert néon',hex:'#d5ff3d'}]},inventory);
 assert.equal((await closed.post(request({color:'Vert Neon'}))).status,400);assert.equal(closed.sessions.length,0);
 const forged=checkout('porte-canette-monster',180,{}, {colors:[{name:'Vert néon',hex:'#d5ff3d'}]},inventory);
 assert.equal((await forged.post(request({color:'not-in-palette'}))).status,400);assert.equal(forged.sessions.length,0);
 const glasses=checkout('lunettes',180,{}, {category:'lunette',colors:[{name:'Vert néon',hex:'#d5ff3d'}]},inventory);
 assert.equal((await glasses.post(request({color:'Vert Neon'}))).status,200);
});


test('Halloween fixed discount checks articles only before creating the Stripe payment session',async()=>{
 const promotion={id:'promo_halloween',active:true,expires_at:Date.now()/1000+3600,max_redemptions:null,times_redeemed:0,restrictions:{minimum_amount:4000,minimum_amount_currency:'eur'},promotion:{coupon:{valid:true,amount_off:500,currency:'eur'}}};
 for (const priceCents of [3999,4000,4500]) {
  const {post,sessions}=checkout('other',180,{}, {priceCents},[],promotion);
  const response=await post(request({},true,{}, {promoCode:'HALLOWEEN5'}));
  assert.equal(response.status,priceCents<4000?400:200);
  if(priceCents<4000){assert.equal(sessions.length,0);assert.match((await response.json()).error,/hors frais de port/);}
  else {assert.deepEqual(sessions[0].discounts,[{promotion_code:'promo_halloween'}]);assert.equal(sessions[0].line_items[0].price_data.unit_amount,priceCents);}
 }
});

test('Christmas kit colours come from live inventory even when the product has no saved palette',async()=>{
 const inventory=[{name:'PLA Rouge',hex:'#e00000',active:true},{name:'Vert Neon',hex:'#d5ff3d',active:false}];
 const product={category:'noel',colors:[],priceCents:1490};
 const good=checkout('noel-thermoforme-2072645',100,{},product,inventory);
 assert.equal((await good.post(request({color:'Rouge'}))).status,200);
 assert.equal(JSON.parse(metadata.readCheckoutItems(good.sessions[0].metadata))[0].c,'Rouge');
 for(const color of ['Vert Neon','Inconnu','']){
  const bad=checkout('noel-thermoforme-2072645',100,{},product,inventory);
  assert.equal((await bad.post(request({color}))).status,400);assert.equal(bad.sessions.length,0);
 }
 const empty=checkout('noel-thermoforme-2072645',100,{},product,[]);
 assert.equal((await empty.post(request({color:'Rouge'}))).status,400);assert.equal(empty.sessions.length,0);
});
