import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
function page(session) {
 const queries=[];
 const stub=()=>React.createElement('span');
 const mocks={
  'next/link':({href,children,...props})=>React.createElement('a',{href,...props},children),
  './LoginForm':stub,'./actions':{customerLogoutAction:async()=>{}},
  '@/lib/customer-auth':{getCustomerSession:async()=>session},
  '@/lib/store':{getCustomerById:async id=>{queries.push(id);return {name:'Client Test',email:'test@example.invalid',country:'RE'};},getOrdersByCustomerEmail:async email=>{queries.push(email);return [{id:'order-test',number:99,createdAt:'2026-11-16',status:'preparing',paymentStatus:'paid',totalCents:3500,email,items:[{name:'Monster',quantity:1,color:'Bleu reflet mauve',customName:'Test'}]}];},getHolderRequests:async id=>{queries.push(id);return [];}},
  '@/components/custom-holder/HolderRequestCard':stub,'@/components/admin/StatusBadge':stub,'@/components/cart/CartRewards':stub,'@/components/account/CustomerProfileForm':stub,
  '@/lib/format':{formatDate:v=>v,formatPrice:v=>`${v/100} €`},'@/lib/rewards':{REWARDS:[]}
 };
 const compiled=ts.transpileModule(readFileSync(new URL('../app/(site)/compte/page.tsx',import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 const mod={exports:{}};new Function('require','module','exports',compiled)(name=>mocks[name]??require(name),mod,mod.exports);
 return {render:async()=>renderToStaticMarkup(await mod.exports.default({searchParams:Promise.resolve({})})),queries};
}
test('account login never loads private customer data',async()=>{
 const p=page(null);const html=await p.render();assert.match(html,/Mon espace Kréarun/);assert.deepEqual(p.queries,[]);assert.doesNotMatch(html,/Commande #99/);
});
test('authenticated dashboard renders all sections and uses only session identity',async()=>{
 const p=page({id:'customer-test',email:'test@example.invalid'});const html=await p.render();
 assert.deepEqual(p.queries,['customer-test','test@example.invalid','customer-test']);
 for(const id of ['commandes','recompenses','personnalisations','coordonnees','aide'])assert.ok(html.includes(`id="${id}"`));
 assert.match(html,/Commande #99/);assert.match(html,/Bleu reflet mauve/);assert.match(html,/Personnalisation : Test/);
});
