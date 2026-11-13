import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { loadTs } from './load-ts.mjs';
const policy=loadTs(new URL('../lib/cart-reminders.ts',import.meta.url));
const require = createRequire(import.meta.url);
const productId = 'abcdefghijklmno';
const item = { productId, quantity: 2, color: 'Blanc', customName: 'Léa' };
function setup() {
 const rows=[]; const deliveries=[]; const claims=new Set(); let paid=false, enabled=true, stripePaid=false, stripeFail=false;
 const store={
  getSettings:async()=>({cart_email_reminder_enabled:enabled}),
  pruneCartReminders:async()=>{},
  findCartReminder:async(field,hash)=>rows.find(row=>row[field]===hash)??null,
  createCartReminder:async input=>{const row={id:'abcdef012345678',...input};rows.push(row);return row;},
  updateCartReminder:async(id,patch)=>Object.assign(rows.find(row=>row.id===id),patch),
  claimCartReminder:async row=>{if(claims.has(row.id))return false;claims.add(row.id);return true;},
  dueCartReminders:async()=>rows.filter(row=>policy.canSendReminder(row)),
  hasPaidOrderSince:async()=>paid,
  getProductById:async()=>({id:productId,active:true,slug:'test',name:'Produit',priceCents:2000,stock:5,images:[],variants:[],weightGrams:100,namePersonalizationEnabled:true,namePersonalizationPriceCents:300,quantityDiscounts:[]}),
 };
 const mocks={
  "./monster-multicolor":loadTs(new URL("../lib/monster-multicolor.ts",import.meta.url)),
  './cart-reminders':policy, './store':store,
  './email':{sendCartReminderEmail:async(email,mode,urls)=>{deliveries.push({email,mode,urls});return true;}},
  './seo':{siteOrigin:()=> 'https://krearun.re'},
  './stripe':{stripeConfigured:()=>true,getStripe:()=>({checkout:{sessions:{retrieve:async()=>{if(stripeFail)throw new Error('unavailable');return {payment_status:stripePaid?'paid':'unpaid'};}}}})},
  './clicker':{CLICKER_PRODUCT_ID:'clicker-studio'},
  './noel-kits':{variantQuantityDiscounts:()=>[]}, './lamp-personalization':{isPersonalizedLamp:()=>false},
 };
 const source=readFileSync(new URL('../lib/cart-reminder-service.ts',import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const module={exports:{}};new Function('require','module','exports',compiled)(name=>mocks[name]??require(name),module,module.exports);
 return {api:module.exports,rows,deliveries,claims,setPaid:value=>paid=value,setEnabled:value=>enabled=value,setStripePaid:value=>stripePaid=value,setStripeFail:value=>stripeFail=value};
}
const input=()=>({email:'Test@Example.fr',consent:true,version:policy.CART_REMINDER_CONSENT_VERSION,cart:[{...item,priceCents:1,email:'private@example.fr'}]});
async function confirmed(s) {
 const result=await s.api.requestCartReminder(input());
 assert.equal(await s.api.confirmCartReminder(result.token),true);
 s.rows[0].dueAt=new Date(Date.now()-1000).toISOString();
 return result.token;
}
test('request needs specific consent; stored cart excludes prices and arbitrary identity',async()=>{
 const s=setup();
 await assert.rejects(s.api.requestCartReminder({...input(),consent:false}));
 await assert.rejects(s.api.requestCartReminder({...input(),version:'old'}));
 await assert.rejects(s.api.requestCartReminder({...input(),email:'bad'}));
 assert.equal(s.deliveries.length,0);
 const result=await s.api.requestCartReminder(input());assert.match(result.token,policy.REMINDER_TOKEN);
 assert.equal(s.rows[0].email,'test@example.fr');assert.deepEqual(s.rows[0].cart,[item]);
 assert.equal(s.rows[0].status,'unconfirmed');assert.equal(s.deliveries[0].mode,'confirm');
 assert.equal((await s.api.processCartReminders()).sent,0);assert.equal(s.deliveries.length,1);
 await s.api.requestCartReminder(input());assert.equal(s.deliveries.length,1);
});
test('double opt-in schedules one reminder and concurrent workers cannot send duplicates',async()=>{
 const s=setup();const token=await confirmed(s);
 assert.equal(await s.api.confirmCartReminder(token),false);
 const results=await Promise.all([s.api.processCartReminders(),s.api.processCartReminders()]);
 assert.equal(results.reduce((sum,r)=>sum+r.sent,0),1);assert.equal(s.deliveries.filter(d=>d.mode==='remind').length,1);
 assert.equal(s.rows[0].status,'sent');assert.ok(s.deliveries[1].urls.unsubscribe.includes(token));
 await s.api.processCartReminders();assert.equal(s.deliveries.length,2);
});
test('unsubscribe prevents sends and repeat requests cannot silently opt back in',async()=>{
 const s=setup();const token=await confirmed(s);await s.api.cancelCartReminder(token);
 assert.equal(s.rows[0].status,'cancelled');assert.deepEqual(s.rows[0].cart,[]);
 assert.equal((await s.api.processCartReminders()).sent,0);assert.deepEqual(await s.api.restoreReminderCart(token),[]);
 await s.api.requestCartReminder(input());assert.equal(s.rows[0].status,'cancelled');assert.equal(s.deliveries.length,1);
});
test('paid orders and paid Stripe sessions both suppress reminders before sending',async()=>{
 for(const stripe of [false,true]){
  const s=setup();await confirmed(s);
  if(stripe){await s.api.attachReminderCheckout('test@example.fr','cs_paid');s.setStripePaid(true);}else{s.setPaid(true);}
  assert.equal((await s.api.processCartReminders()).sent,0);assert.equal(s.rows[0].status,'purchased');assert.equal(s.deliveries.length,1);
 }
});
test('payment-check outages and disabled automation fail closed without consuming the send claim',async()=>{
 const s=setup();await confirmed(s);await s.api.attachReminderCheckout('test@example.fr','cs_test');s.setStripeFail(true);
 await assert.rejects(s.api.processCartReminders());assert.equal(s.claims.size,0);assert.equal(s.deliveries.length,1);
 s.setStripeFail(false);s.setEnabled(false);assert.equal((await s.api.processCartReminders()).sent,0);assert.equal(s.deliveries.length,1);
});
test('expired links and old confirmation links cannot subscribe or restore',async()=>{
 const s=setup();const {token}=await s.api.requestCartReminder(input());
 s.rows[0].consentAt=new Date(Date.now()-25*3600_000).toISOString();assert.equal(await s.api.confirmCartReminder(token),false);
 s.rows[0].expiresAt=new Date(Date.now()-1000).toISOString();assert.equal(await s.api.cartReminderForToken(token),null);
 assert.equal(await s.api.cartReminderForToken('not-a-token'),null);assert.deepEqual(await s.api.restoreReminderCart(token),[]);
});
test('restoration uses current price, personalization, stock and weight instead of client prices',async()=>{
 const s=setup();const token=await confirmed(s);const [restored]=await s.api.restoreReminderCart(token);
 assert.equal(restored.priceCents,2300);assert.equal(restored.personalizationPriceCents,300);assert.equal(restored.stock,5);assert.equal(restored.weightGrams,100);assert.equal(restored.customName,'Léa');
});
test('browser reminder requires a nonempty saved cart and at least thirty minutes away',()=>{
 const now=Date.now();assert.equal(policy.shouldShowCartReturn(now-31*60_000,1,now),true);
 assert.equal(policy.shouldShowCartReturn(now-29*60_000,1,now),false);
 assert.equal(policy.shouldShowCartReturn(now-31*60_000,0,now),false);
 assert.equal(policy.shouldShowCartReturn(0,1,now),false);
 assert.equal(policy.shouldShowCartReturn(now+1000,1,now),false);
});

test('email-provider one-click unsubscribe requires the opaque token and explicit POST parameter',async()=>{
 const calls=[];
 const source=readFileSync(new URL('../app/api/cart-reminders/unsubscribe/[token]/route.ts',import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const module={exports:{}};
 new Function('require','module','exports',compiled)(name=>({'@/lib/cart-reminder-service':{cancelCartReminder:async token=>calls.push(token)},'@/lib/cart-reminders':policy}[name]??require(name)),module,module.exports);
 const token='a'.repeat(64);
 const request=value=>new Request('https://krearun.re/api/cart-reminders/unsubscribe/'+token,{method:'POST',body:new URLSearchParams(value)});
 assert.equal((await module.exports.POST(request({}),{params:Promise.resolve({token})})).status,400);
 assert.equal((await module.exports.POST(request({'List-Unsubscribe':'One-Click'}),{params:Promise.resolve({token:'bad'})})).status,400);
 assert.equal(calls.length,0);
 assert.equal((await module.exports.POST(request({'List-Unsubscribe':'One-Click'}),{params:Promise.resolve({token})})).status,204);
 assert.deepEqual(calls,[token]);
});


test('a payment after reminder delivery also disables the recovery link',async()=>{
 const s=setup();const token=await confirmed(s);await s.api.processCartReminders();s.setPaid(true);
 assert.deepEqual(await s.api.restoreReminderCart(token),[]);assert.equal(s.rows[0].status,'purchased');
});
