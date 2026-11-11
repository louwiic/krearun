import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
function setup({saveFails=false,mailFails=false}={}) {
  const pending=[];const delivered=[];const saved=[];
  const mocks={
    'next/server':{NextResponse:{json:(body,options)=>Response.json(body,options)},after:fn=>pending.push(fn)},
    '@/lib/store':{getProductById:async()=>({name:'Produit'}),createReview:async input=>{if(saveFails)throw Error('storage');saved.push(input);return {...input,id:'review1'};}},
    '@/lib/email':{sendNewReviewNotification:async review=>{delivered.push(review);if(mailFails)throw Error('mail');return true;}},
    '@/lib/r2':{},sharp:{},
  };
  const compiled=ts.transpileModule(readFileSync(new URL('../app/api/reviews/route.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}};new Function('require','module','exports',compiled)(name=>mocks[name],module,module.exports);
  return {...module.exports,pending,delivered,saved};
}
function request(message='Un produit très réussi et reçu rapidement.'){const body=new FormData();for(const [key,value] of Object.entries({productId:'product1',productName:'Produit',authorName:'Léa',email:'lea@example.fr',rating:'5',message}))body.set(key,value);return new Request('https://example.test/api/reviews',{method:'POST',body});}
test('notify only after successful persistence, without delaying the response',async()=>{
 const s=setup();const response=await s.POST(request());assert.equal(response.status,200);assert.equal(s.saved.length,1);assert.equal(s.delivered.length,0);assert.equal(s.pending.length,1);await s.pending[0]();assert.equal(s.delivered[0].id,'review1');
});
test('invalid or unsaved reviews never trigger email',async()=>{
 const invalid=setup();assert.equal((await invalid.POST(request('court'))).status,400);assert.equal(invalid.pending.length,0);
 const failed=setup({saveFails:true});assert.equal((await failed.POST(request())).status,500);assert.equal(failed.pending.length,0);
});
test('mail failure cannot undo a recorded review or reject the callback',async()=>{
 const s=setup({mailFails:true});const response=await s.POST(request());assert.equal(response.status,200);await assert.doesNotReject(s.pending[0]());assert.equal(s.saved.length,1);
});
