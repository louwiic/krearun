import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './load-ts.mjs';
const keychains=loadTs(new URL('../lib/name-keychain.ts',import.meta.url));
const configuration={name:'Léa',font:'chewy',style:'relief',baseColor:'#542b8a',baseColorName:'Violet',textColor:'#fae933',textColorName:'Jaune'};
test('paid manufacturing files are generated once per configured order line and remain linked to the order',async()=>{
 const files=[],saves=[];let generations=0;
 const api=loadTs(new URL('../lib/name-keychain-fulfillment.ts',import.meta.url),{
  './store':{listKeychainFiles:async()=>files,saveKeychainFile:async(input,bytes)=>{saves.push(input);files.push(input);assert.ok(bytes.length>0);}},
  './name-keychain-server':{generateKeychain:async()=>{generations++;return new Uint8Array([1]);}},
 });
 const order={id:'abcdefghijklmno',number:17,items:[{productId:'other'},{productId:keychains.KEYCHAIN_ID,keychainConfiguration:configuration,quantity:2}]};
 await api.fulfillOrderKeychains(order);await api.fulfillOrderKeychains(order);
 assert.equal(generations,1);assert.equal(saves[0].uniqueKey,'order:abcdefghijklmno:1');assert.equal(saves[0].source,'order');assert.deepEqual(saves[0].configuration,configuration);
});
test('webhook retries recover a missing manufacturing file without creating or decrementing the order again',async()=>{
 let order=null,created=0,stock=0,generated=0;const packed=loadTs(new URL('../lib/checkout-item-metadata.ts',import.meta.url));
 const session={id:'cs_test',payment_status:'paid',metadata:packed.packCheckoutItems([{p:keychains.KEYCHAIN_ID,q:1,u:1200,c:'Violet / Jaune',h:configuration}]),customer_details:{email:'test@example.invalid',name:'Test'},amount_subtotal:1200,amount_total:1200};
 const event={type:'checkout.session.completed',data:{object:session}};
 const route=loadTs(new URL('../app/api/stripe/webhook/route.ts',import.meta.url),{
  '@/lib/name-keychain':keychains,
  '@/lib/name-keychain-fulfillment':{fulfillOrderKeychains:async()=>{generated++;if(generated===1)throw new Error('temporarily unavailable');}},
  '@/lib/metropolitan-shipping':{readShippingQuote:()=>undefined},'@/lib/checkout-item-metadata':packed,
  '@/lib/stripe':{getStripe:()=>({webhooks:{constructEvent:()=>event}})},
  '@/lib/store':{getOrderByStripeSession:async()=>order,getProductById:async()=>keychains.KEYCHAIN_PRODUCT,createOrder:async input=>{created++;order={...input,id:'abcdefghijklmno',number:17};return order;},decrementStock:async()=>{stock++;}},
  '@/lib/email':{sendOrderConfirmation:async()=>{},sendAdminNewOrder:async()=>{}},
  '@/lib/custom-letter-settings':{},'@/lib/clicker':{},'@/lib/custom-holder-fulfillment':{},
  '@/lib/cart-reminder-service':{stopCartReminderAfterPurchase:async()=>{}},
 });
 const previous=process.env.STRIPE_WEBHOOK_SECRET;process.env.STRIPE_WEBHOOK_SECRET='test';
 const req=()=>new Request('https://krearun.re/api/stripe/webhook',{method:'POST',headers:{'stripe-signature':'test'},body:'test'});
 try{
  assert.equal((await route.POST(req())).status,500);assert.equal(created,1);assert.equal(stock,1);assert.deepEqual(order.items[0].keychainConfiguration,keychains.parseKeychainConfiguration(configuration));
  assert.equal((await route.POST(req())).status,200);assert.equal(created,1);assert.equal(stock,1);assert.equal(generated,2);
  event.data.object.payment_status='unpaid';assert.equal((await route.POST(req())).status,200);assert.equal(generated,2);
 }finally{if(previous===undefined)delete process.env.STRIPE_WEBHOOK_SECRET;else process.env.STRIPE_WEBHOOK_SECRET=previous;}
});
test('manufacturing export endpoints require admin authentication',async()=>{
 for(const [filename,method,argument] of [['../app/api/admin/keychains/route.ts','POST',new Request('https://krearun.re/api/admin/keychains',{method:'POST',body:'{}'})],['../app/api/admin/keychains/[id]/route.ts','GET',new Request('https://krearun.re/api/admin/keychains/abcdefghijklmno')]]){
  const route=loadTs(new URL(filename,import.meta.url),{'@/lib/auth':{isAdmin:async()=>false},'@/lib/store':{},'@/lib/name-keychain':{},'@/lib/name-keychain-server':{},'@/lib/print-files':{}});
  assert.equal((await route[method](argument,{params:Promise.resolve({id:'abcdefghijklmno'})})).status,401);
 }
});
