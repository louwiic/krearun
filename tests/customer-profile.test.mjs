import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './load-ts.mjs';
const {customerProfileInput}=loadTs(new URL('../lib/customer-profile.ts',import.meta.url));
const make=overrides=>{const form=new FormData();for(const [k,v]of Object.entries({name:' Client ',country:'RE',postalCode:'97430',...overrides}))form.set(k,v);return form;};
test('profile input only accepts contact fields, trims and validates',()=>{
 const result=customerProfileInput(make({id:'another-account',email:'other@example.invalid',password:'forged'}));
 assert.equal(result.name,'Client');assert.equal(result.postalCode,'97430');
 assert.equal(result.id,undefined);assert.equal(result.email,undefined);assert.equal(result.password,undefined);
 for(const invalid of [{name:''},{postalCode:'abc'},{country:'US'},{name:'a'.repeat(151)}])assert.throws(()=>customerProfileInput(make(invalid)));
});
test('profile action refuses anonymous updates and uses the authenticated identity',async()=>{
 let current=null;const writes=[];
 const {saveCustomerProfileAction}=loadTs(new URL('../app/(site)/compte/actions.ts',import.meta.url),{
  'next/navigation':{redirect:()=>{}},'next/cache':{revalidatePath:()=>{}},
  '@/lib/customer-auth':{getCustomerSession:async()=>current},
  '@/lib/customer-profile':{customerProfileInput},'@/lib/store':{updateCustomerProfile:async(...args)=>writes.push(args)}
 });
 assert.ok((await saveCustomerProfileAction({},make())).error);assert.equal(writes.length,0);
 current={id:'authenticated-id'};
 assert.ok((await saveCustomerProfileAction({},make({id:'victim-id'}))).success);
 assert.equal(writes[0][0],'authenticated-id');
});
