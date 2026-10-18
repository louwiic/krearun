import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import sharp from 'sharp';
import * as jose from 'jose';
import * as holder from '../lib/custom-holder.ts';
import * as palette from '../lib/logo-palette.ts';
const require=createRequire(import.meta.url);
function load(path,mocks={}) {
  const source=readFileSync(new URL(path,import.meta.url),'utf8');
  const {outputText}=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}});
  const compiledModule={exports:{}};new Function('require','module','exports',outputText)(name=>mocks[name]??require(name),compiledModule,compiledModule.exports);return compiledModule.exports;
}
const payment=load('../lib/custom-holder-payment.ts',{'./custom-holder':holder});
const svg=load('../lib/holder-svg.ts');
const image=load('../lib/custom-holder-logo.ts',{'./custom-holder':holder,'./logo-palette':palette,'./holder-svg':svg});
const http=load('../lib/custom-holder-http.ts',{'./custom-holder':holder});
const base={id:'aaaaaaaaaaaaaaa',customerId:'bbbbbbbbbbbbbbb',customerEmail:'owner@example.invalid',customerName:'Owner',quantity:2,note:'',configuration:{bodyColor:'#112233',bodyColorName:'Bleu',logoWidth:45,logoOffset:0},palette:['#ff0000'],logo:'logo.png',originalLogo:'original.png',submissionKey:'key',stripeSessionId:'cs_holder',orderId:'',created:'2026-10-13'};
const approved={...base,decision:{id:'ccccccccccccccc',requestId:base.id,status:'approved',unitPriceCents:2190,shippingCents:490,message:'Validé',created:'2026-10-13'}};

test('payment is gated by approval, owner and unpaid state',()=>{
  assert.equal(holder.canPayHolder(base,base.customerId),false);
  assert.equal(holder.canPayHolder(approved,'another-owner'),false);
  assert.equal(holder.canPayHolder({...approved,orderId:'paid-order'},base.customerId),false);
  assert.equal(holder.canPayHolder({...approved,decision:{...approved.decision,status:'rejected'}},base.customerId),false);
  assert.equal(holder.canPayHolder(approved,base.customerId),true);
  assert.equal(holder.holderTotal(approved),4870);
});
test('checkout uses the stored quote, quantity and owner, never a browser price',()=>{
  const params=payment.holderCheckoutParams(approved,base.customerId,'https://krearun.re');
  assert.equal(params.line_items[0].price_data.unit_amount,2190);assert.equal(params.line_items[0].quantity,2);
  assert.equal(params.shipping_options[0].shipping_rate_data.fixed_amount.amount,490);
  assert.equal(params.metadata.holderCustomerId,base.customerId);
  assert.throws(()=>payment.holderCheckoutParams(base,base.customerId,'https://krearun.re'));
});
test('webhook requires paid status and the exact stored session, owner and amounts',()=>{
  const session={id:'cs_holder',metadata:{customHolderRequest:base.id,holderCustomerId:base.customerId},payment_status:'paid',currency:'eur',amount_total:4870,amount_subtotal:4380};
  assert.equal(payment.validHolderPayment(approved,session),true);
  for(const patch of [{payment_status:'unpaid'},{amount_total:1},{amount_subtotal:1},{currency:'usd'},{id:'other'},{metadata:{customHolderRequest:base.id,holderCustomerId:'other'}}])assert.equal(payment.validHolderPayment(approved,{...session,...patch}),false);
});
test('configuration rejects malformed colors, ranges and nonfinite values',()=>{
  assert.deepEqual(holder.parseHolderConfiguration(base.configuration),base.configuration);
  assert.equal(holder.parseHolderConfiguration({...base.configuration,logoFaces:2}).logoFaces,2);
  assert.throws(()=>holder.parseHolderConfiguration({...base.configuration,logoFaces:3}));
  for(const patch of [{bodyColor:'url(javascript:alert(1))'},{logoWidth:0},{logoOffset:26},{logoWidth:NaN}])assert.throws(()=>holder.parseHolderConfiguration({...base.configuration,...patch}));
  assert.equal(holder.euroCents('17,90'),1790);assert.equal(holder.euroCents('0',true),0);assert.throws(()=>holder.euroCents('-1'));assert.throws(()=>holder.euroCents('1.999'));
});
test('transparent pixels are ignored and simple logos keep their exact RGB colors',()=>{
  const result=palette.reduceLogoColors(new Uint8Array([255,0,0,255,0,255,0,255,1,2,3,0]));
  assert.equal(result.reduced,false);assert.deepEqual(result.palette,['#ff0000','#00ff00']);assert.equal(result.pixels[11],0);
  assert.throws(()=>palette.reduceLogoColors(new Uint8Array([1,2,3,0])));
});
test('complex uploaded images produce a PNG with no more than four opaque colors',async()=>{
  const raw=Buffer.from(Array.from({length:64},(_,i)=>[i*3,i*2,255-i*3,255]).flat());
  const png=await sharp(raw,{raw:{width:8,height:8,channels:4}}).png().toBuffer();
  const prepared=await image.prepareHolderLogo(new File([png],'logo.png',{type:'image/png'}));
  assert.equal(prepared.reduced,true);assert.ok(prepared.palette.length<=4);
  const {data}=await sharp(prepared.logo).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const colors=new Set();for(let i=0;i<data.length;i+=4)if(data[i+3])colors.add([...data.slice(i,i+3)].join(','));
  assert.ok(colors.size<=4);
  await assert.rejects(image.prepareHolderLogo(new File([Buffer.alloc(holder.LOGO_MAX_BYTES+1)],'large.png')),/5 Mo/);
  await assert.rejects(image.prepareHolderLogo(new File(['<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"/>'],'unsafe.svg')));
});
test('multipart size and origin are checked before image decoding',async()=>{
  const foreign=new Request('https://krearun.re/api/porte-boisson/logo',{method:'POST',headers:{origin:'https://other.invalid'},body:'data'});
  assert.throws(()=>http.checkHolderOrigin(foreign));
  const oversized=new Request('https://krearun.re/api/porte-boisson/logo',{method:'POST',headers:{'content-length':String(holder.LOGO_MAX_BYTES+100000)},body:'x'});
  await assert.rejects(http.holderFormData(oversized),/volumineux/);
});
test('payment route rejects strangers and unapproved requests before calling Stripe',async()=>{
  let currentCustomer={id:'stranger'};let request=approved;let stripeCalls=0;
  const route=load('../app/api/porte-boisson/demandes/[id]/paiement/route.ts',{
    '@/lib/customer-auth':{getCustomerSession:async()=>currentCustomer},
    '@/lib/store':{getHolderRequest:async()=>request,saveHolderCheckout:async()=>{}},
    '@/lib/custom-holder':holder,'@/lib/custom-holder-payment':payment,'@/lib/custom-holder-http':http,
    '@/lib/stripe':{stripeConfigured:()=>true,getStripe:()=>{stripeCalls++;throw new Error('Unexpected Stripe call');}},
  });
  const call=()=>route.POST(new Request('https://krearun.re/api/porte-boisson/demandes/x/paiement',{method:'POST'}),{params:Promise.resolve({id:base.id})});
  assert.equal((await call()).status,404);currentCustomer={id:base.customerId};request=base;
  assert.equal((await call()).status,409);currentCustomer=null;assert.equal((await call()).status,401);assert.equal(stripeCalls,0);
});
test('private logo endpoint never fetches a file for another customer',async()=>{
  let session={id:'stranger'};let reads=0;
  const route=load('../app/api/porte-boisson/demandes/[id]/logo/route.ts',{
    '@/lib/customer-auth':{getCustomerSession:async()=>session},'@/lib/auth':{isAdmin:async()=>false},
    '@/lib/store':{getHolderRequest:async()=>base,getHolderLogo:async()=>{reads++;return Buffer.from('png');}},
  });
  const call=()=>route.GET(new Request('https://krearun.re/api/porte-boisson/demandes/x/logo'),{params:Promise.resolve({id:base.id})});
  assert.equal((await call()).status,404);assert.equal(reads,0);session={id:base.customerId};assert.equal((await call()).status,200);assert.equal(reads,1);
});
test('replayed holder webhooks link the existing order without duplicate orders or notifications',async()=>{
  let createCalls=0,notices=0,links=0;
  const fulfillment=load('../lib/custom-holder-fulfillment.ts',{
    './custom-holder':holder,'./custom-holder-payment':payment,
    './store':{getHolderRequest:async()=>approved,getOrderByStripeSession:async()=>({id:'ddddddddddddddd'}),getOrderBySourceId:async()=>null,createOrder:async()=>{createCalls++;},markHolderPaid:async()=>{links++;}},
    './email':{sendAdminNewOrder:async()=>{notices++;},sendOrderConfirmation:async()=>{notices++;}},
  });
  await fulfillment.fulfillHolderPayment({id:'cs_holder',metadata:{customHolderRequest:base.id,holderCustomerId:base.customerId},payment_status:'paid',currency:'eur',amount_total:4870,amount_subtotal:4380});
  assert.equal(createCalls,0);assert.equal(notices,0);assert.equal(links,1);
});

test('customer sessions cannot be reused as an admin token',async()=>{
  const auth=load('../lib/auth.ts',{'jose':jose,'next/headers':{},'./session-cookie':{sessionCookieOptions:()=>({})}});
  const key=new TextEncoder().encode(process.env.AUTH_SECRET||'krearun-studio-dev-secret');
  const customer=await new jose.SignJWT({role:'customer'}).setProtectedHeader({alg:'HS256'}).setExpirationTime('1h').sign(key);
  const admin=await new jose.SignJWT({role:'admin'}).setProtectedHeader({alg:'HS256'}).setExpirationTime('1h').sign(key);
  assert.equal(await auth.verifyAdminToken(customer),false);assert.equal(await auth.verifyAdminToken(admin),true);
});

test('paid approved requests create a normal order with the approved configuration reference',async()=>{
  let input,linked,notices=0;
  const fulfillment=load('../lib/custom-holder-fulfillment.ts',{
    './custom-holder':holder,'./custom-holder-payment':payment,
    './store':{getHolderRequest:async()=>approved,getOrderByStripeSession:async()=>null,getOrderBySourceId:async()=>null,createOrder:async value=>{input=value;return {...value,id:'ddddddddddddddd'};},markHolderPaid:async(id,orderId)=>{linked={id,orderId};}},
    './email':{sendAdminNewOrder:async()=>{notices++;},sendOrderConfirmation:async()=>{notices++;}},
  });
  await fulfillment.fulfillHolderPayment({id:'cs_holder',metadata:{customHolderRequest:base.id,holderCustomerId:base.customerId},payment_status:'paid',currency:'eur',amount_total:4870,amount_subtotal:4380,collected_information:{shipping_details:{name:'Owner',address:{line1:'1 rue du test',city:'Saint-Denis',postal_code:'97400',country:'RE'}}},customer_details:{phone:'0692000000'}});
  assert.equal(input.items[0].holderRequestId,base.id);assert.equal(input.items[0].quantity,2);assert.equal(input.items[0].weightGrams,180);assert.equal(input.sourceId,`holder:${base.id}`);assert.equal(input.status,'paid');assert.equal(linked.orderId,'ddddddddddddddd');assert.equal(notices,2);
});

test('SVG uploads preserve a safe vector source and rasterize large viewBoxes within four colors',async()=>{
  const file=new File(['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8000 9000"><path fill="#ff0000" d="M0 0H4000V9000H0Z"/><path fill="#0000ff" d="M4000 0H8000V9000H4000Z"/></svg>'],'logo.svg',{type:'image/svg+xml'});
  const prepared=await image.prepareHolderLogo(file);
  assert.ok(prepared.sourceSvg.toString().includes('viewBox="0 0 8000 9000"'));
  assert.ok(prepared.palette.length<=4);assert.equal((await sharp(prepared.logo).metadata()).format,'png');
  for(const model of ['om','arsenal']){const preset=await image.prepareHolderPreset(model);assert.ok(preset.sourceSvg.length>100);assert.ok(preset.palette.length<=4);}
});
test('SVG scripts, external resources and XML entities are rejected before rendering',()=>{
  for(const content of ['<script>alert(1)</script>','<rect onload="alert(1)"/>','<use href="https://example.invalid/a.svg#x"/>','<style>path{fill:url(https://example.invalid/a)}</style>','<foreignObject/>'])assert.throws(()=>svg.sanitizeHolderSvg(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">${content}</svg>`)));
  assert.throws(()=>svg.sanitizeHolderSvg(Buffer.from('<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg xmlns="http://www.w3.org/2000/svg"/>')));
});
test('model selection is explicit and older custom requests stay compatible',()=>{
  assert.equal(holder.holderModel(base.configuration),'custom');
  for(const model of ['custom','om','arsenal'])assert.equal(holder.parseHolderConfiguration({...base.configuration,model}).model,model);
  assert.throws(()=>holder.parseHolderConfiguration({...base.configuration,model:'../../secret'}));
});

test('the body accepts only plain black/white inventory names and logo palettes stay bounded',()=>{
  for(const name of ['noir','Blanc','PLA Blanc'])assert.equal(holder.isHolderBodyColor({name}),true);
  for(const name of ['bleu','blanc translucide','noir pailleté'])assert.equal(holder.isHolderBodyColor({name}),false);
  for(const logoColors of [[],['#000000','#000000','#000000','#000000','#000000'],['red'],['#12345g']])assert.throws(()=>holder.parseHolderConfiguration({...base.configuration,logoColors}));
});
test('logo recoloring changes only its selected color slots and preserves transparency',async()=>{
  const pixels=new Uint8Array([255,0,0,255,0,255,0,255,0,0,0,0]);
  const result=palette.recolorLogoPixels(pixels,['#ff0000','#00ff00'],['#0000ff','#ffffff']);
  assert.deepEqual([...result],[0,0,255,255,255,255,255,255,0,0,0,0]);assert.equal(pixels[0],255);
  assert.throws(()=>palette.recolorLogoPixels(pixels,['#ff0000'],[]));
  for(const model of ['om','arsenal']){
    const prepared=await image.prepareHolderPreset(model);assert.deepEqual(prepared.palette,holder.HOLDER_PRESET_PALETTES[model]);
    const recolored=await image.recolorHolderLogo(prepared,prepared.palette.map(()=>'#ff0000'));assert.deepEqual(recolored.palette,['#ff0000']);assert.equal(recolored.original.compare(prepared.original),0);assert.equal(recolored.sourceSvg.compare(prepared.sourceSvg),0);
  }
});

test('submission enforces black/white bodies and stores the chosen model and logo colors server-side',async()=>{
  let saved;let storedLogo;
  const route=load('../app/api/porte-boisson/demandes/route.ts',{
    '@/lib/customer-auth':{getCustomerSession:async()=>({id:base.customerId})},
    '@/lib/store':{getProductBySlug:async()=>({active:true}),getCustomerById:async()=>({email:base.customerEmail,name:base.customerName}),getInventoryColors:async()=>[{name:'noir',hex:'#171717'},{name:'Blanc',hex:'#ffffff'},{name:'bleu',hex:'#0000ff'}],getHolderRequests:async()=>[],createHolderRequest:async(input,logo)=>{saved=input;storedLogo=logo;return {...base,...input};}},
    '@/lib/custom-holder':holder,'@/lib/custom-holder-logo':image,'@/lib/custom-holder-http':http,
    '@/lib/email':{sendHolderRequestNotification:async()=>{}},
  });
  async function submit(patch){const form=new FormData();form.set('quantity','1');form.set('confirmed','true');form.set('submissionKey',crypto.randomUUID());form.set('configuration',JSON.stringify({...base.configuration,model:'om',bodyColor:'#171717',bodyColorName:'noir',...patch}));return route.POST(new Request('https://krearun.re/api/porte-boisson/demandes',{method:'POST',body:form}));}
  assert.equal((await submit({bodyColor:'#0000ff',bodyColorName:'bleu'})).status,400);assert.equal(saved,undefined);
  assert.equal((await submit({logoColors:['#123456','#0097d7']})).status,400);assert.equal(saved,undefined);
  assert.equal((await submit({logoColors:['#0000ff','#0000ff'],topEngravingText:'Dr. Chris VW',bottomEngravingText:'BOSS'})).status,200);
  assert.equal(saved.configuration.model,'om');assert.deepEqual(saved.palette,['#0000ff']);assert.equal(saved.configuration.topEngravingText,'Dr. Chris VW');assert.equal(saved.configuration.bottomEngravingText,'BOSS');
  const {data}=await sharp(storedLogo).ensureAlpha().raw().toBuffer({resolveWithObject:true});for(let i=0;i<data.length;i+=4)if(data[i+3])assert.deepEqual([...data.subarray(i,i+3)],[0,0,255]);
});

test('engraving text and ring colors are normalized and validated without altering older configurations',()=>{
 const parsed=holder.parseHolderConfiguration({...base.configuration,verticalName:' LOÏC ',engravingText:' Mon équipe ',topColor:'#FFAA00',bottomColor:'#FFFFFF'});assert.equal(parsed.verticalName,'LOÏC');assert.equal(parsed.engravingText,'Mon équipe');assert.equal(parsed.topColor,'#ffaa00');
 for(const patch of [{verticalName:'x'.repeat(13)},{engravingText:'x'.repeat(33)},{verticalName:'<script>'},{engravingText:'😊'},{topColor:'red'},{bottomColor:'url(x)'}])assert.throws(()=>holder.parseHolderConfiguration({...base.configuration,...patch}));
});

test('top and bottom engravings are optional, independent and validated on submission',()=>{
 const original=holder.parseHolderConfiguration(base.configuration);assert.equal(original.topEngravingText,undefined);assert.equal(original.bottomEngravingText,undefined);
 for(const patch of [{topEngravingText:' Dr. Chris VW '},{bottomEngravingText:' BOSS '},{topEngravingText:' Dr. Chris VW ',bottomEngravingText:' BOSS '}]){
  const result=holder.parseHolderConfiguration({...base.configuration,...patch});
  for(const key of Object.keys(patch))assert.equal(result[key],patch[key].trim());
 }
 for(const key of ['topEngravingText','bottomEngravingText'])for(const value of ['x'.repeat(33),'<script>','😊',45,null])assert.throws(()=>holder.parseHolderConfiguration({...base.configuration,[key]:value}));
 assert.equal(holder.parseHolderConfiguration({...base.configuration,engravingText:'Ancien texte'}).engravingText,'Ancien texte');
});
