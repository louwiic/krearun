import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { loadTs } from './load-ts.mjs';
const c=loadTs(new URL('../lib/coffrets.ts',import.meta.url));
const metadata=loadTs(new URL('../lib/checkout-item-metadata.ts',import.meta.url));
const orders=loadTs(new URL('../lib/order-details.ts',import.meta.url));
const reminders=loadTs(new URL('../lib/cart-reminders.ts',import.meta.url));
const tariffs={petit:{coffret_avec_poissons:2000,poissons_seuls:900,poids_coffret_g:80,poids_poissons_g:15},grand:{coffret_avec_poissons:3000,poissons_seuls:1200,poids_coffret_g:150,poids_poissons_g:25}};
const small={formule:'coffret_avec_poissons',format:'petit',modele:'Coco',police:'F2',couleur:'bleu'};
const large={...small,format:'grand',modele:'Sardine',police:'F4'};
test('small Coco and large Sardine retain exact catalogue text, different fonts and version through Stripe packing and workshop details',()=>{
 const configurations=[small,large].map(c.coffretConfiguration);
 assert.equal(configurations[0].titre,'Range ton coco');
 assert.equal(configurations[1].phrase,'Poisson y bek su le tard');
 assert.notEqual(c.coffretLineId(configurations[0]),c.coffretLineId(configurations[1]));
 assert.notEqual(c.coffretLineId(configurations[0]),c.coffretLineId({...configurations[0],police:'F9'}));
 const packed=JSON.parse(metadata.readCheckoutItems(metadata.packCheckoutItems(configurations.map(b=>({b,q:2})))));
 for(let i=0;i<packed.length;i++){
  assert.deepEqual(packed[i].b,configurations[i]);
  const details=orders.orderItemDetails({coffretConfiguration:packed[i].b});
  for(const field of c.coffretDetails(configurations[i])) assert.ok(details.some(d=>d.label===field.label&&d.value===field.value));
 }
});
test('switching a line to fish alone strips decor, font, colour and inscriptions, reprices by compatibility size',()=>{
 const quote=c.coffretQuote({...large,formule:'poissons_seuls',titre:'forged',phrase:'forged'},3,tariffs);
 assert.deepEqual(quote.configuration,{formule:'poissons_seuls',format:'grand',titre:'',phrase:'',dessinVersion:c.COFFRET_VERSION});
 assert.equal(quote.totalCents,3600);assert.equal(quote.weightGrams,25);
 assert.ok(c.coffretDetails(quote.configuration).every(d=>!['Police','Décor','Titre','Couleur du coffret'].includes(d.label)));
});
test('pricing is recomputed from Kréarun tariff, tampered catalogue text is discarded, unconfigured sale blocked',()=>{
 const quote=c.coffretQuote({...small,priceCents:1,titre:'Injected',phrase:'Injected',dessinVersion:'evil'},2,tariffs);
 assert.equal(quote.totalCents,4000);assert.equal(quote.configuration.titre,'Range ton coco');assert.equal(quote.configuration.phrase,'');assert.equal(quote.configuration.dessinVersion,c.COFFRET_VERSION);
 assert.equal(c.coffretQuote(small,1).priceCents,990);
 assert.equal(c.coffretQuote(large,1).priceCents,1490);
 assert.equal(c.coffretQuote(small,1).weightGrams,100);
 assert.equal(c.coffretQuote(large,1).weightGrams,100);
 assert.throws(()=>c.coffretQuote({...small,formule:"poissons_seuls"},1),/tarifs et poids/);
 for(const field of ['format','formule','modele','couleur','police'])assert.throws(()=>c.coffretQuote({...small,[field]:'unknown'},1,tariffs));
 for(const q of [0,-1,1.5,21,'2',null,NaN])assert.throws(()=>c.coffretQuote(small,q,tariffs));
});
test('all eight previews, SVGs and nine reference font samples are present',()=>{
 for(const model of c.COFFRET_MODELS){const m=c.COFFRET_CATALOGUE.modeles[model];for(const file of [m.svg,m.apercu])assert.ok(existsSync(new URL(`../public/coffrets/${file}`,import.meta.url)));}
 for(const font of Object.keys(c.COFFRET_CATALOGUE.polices))assert.ok(existsSync(new URL(`../public/coffrets/reference/${font}.webp`,import.meta.url)));
});
test('saved reminder keeps exact choices and cleans old box options for fish only',()=>{
 for(const config of [small,large,{...large,formule:'poissons_seuls'}]){
  const [saved]=reminders.reminderCart([{productId:c.COFFRET_ID,quantity:2,color:'forged',coffretConfiguration:config}]);
  assert.deepEqual(saved.coffretConfiguration,c.coffretConfiguration(config));
  assert.equal(saved.color,saved.coffretConfiguration.couleur||'');
 }
});


test('signed paid webhook preserves both workshop snapshots and does not look up virtual products',async()=>{
 let order=null;const stockCalls=[];
 const configurations=[small,large].map(c.coffretConfiguration);
 const items=configurations.map((b,i)=>({p:c.COFFRET_ID,q:2,c:b.couleur,u:2000+i*1000,v:c.coffretLineId(b),b}));
 const session={id:'cs_coffrets_test',payment_status:'paid',metadata:metadata.packCheckoutItems(items),amount_subtotal:10000,amount_total:10000};
 const route=loadTs(new URL('../app/api/stripe/webhook/route.ts',import.meta.url),{
  '@/lib/coffrets':c,
  '@/lib/name-keychain':loadTs(new URL('../lib/name-keychain.ts',import.meta.url)),'@/lib/gta-gift':loadTs(new URL('../lib/gta-gift.ts',import.meta.url)),
  '@/lib/name-keychain-fulfillment':{fulfillOrderKeychains:async()=>{}},
  '@/lib/metropolitan-shipping':{readShippingQuote:()=>undefined},'@/lib/checkout-item-metadata':metadata,
  '@/lib/stripe':{getStripe:()=>({webhooks:{constructEvent:()=>({type:'checkout.session.completed',data:{object:session}})}})},
  '@/lib/store':{getOrderByStripeSession:async()=>order,getProductById:async()=>{throw Error('Virtual product lookup');},createOrder:async input=>(order={...input,id:'coffrets_test',number:17}),decrementStock:async input=>stockCalls.push(input)},
  '@/lib/email':{sendOrderConfirmation:async()=>{},sendAdminNewOrder:async()=>{}},
  '@/lib/custom-letter-settings':{},'@/lib/clicker':{},'@/lib/custom-holder-fulfillment':{},
  '@/lib/shared-cart':loadTs(new URL('../lib/shared-cart.ts',import.meta.url)),
  '@/lib/public-copy':loadTs(new URL('../lib/public-copy.ts',import.meta.url)),
  '@/lib/cart-reminder-service':{stopCartReminderAfterPurchase:async()=>{}},
 });
 const previous=process.env.STRIPE_WEBHOOK_SECRET;process.env.STRIPE_WEBHOOK_SECRET='test';
 const req=()=>new Request('https://krearun.re/api/stripe/webhook',{method:'POST',headers:{'stripe-signature':'test'},body:'test'});
 try{
  assert.equal((await route.POST(req())).status,200);
  assert.deepEqual(order.items.map(i=>i.coffretConfiguration),configurations);
  assert.deepEqual(order.items.map(i=>i.priceCents),[2000,3000]);
  assert.deepEqual(stockCalls,[[]]);
  assert.equal((await route.POST(req())).status,200);assert.equal(stockCalls.length,1);
 }finally{if(previous===undefined)delete process.env.STRIPE_WEBHOOK_SECRET;else process.env.STRIPE_WEBHOOK_SECRET=previous;}
});
