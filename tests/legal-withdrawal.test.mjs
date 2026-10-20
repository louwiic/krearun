import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(path,mocks={}) {
 const source=readFileSync(new URL(path,import.meta.url),'utf8');
 const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 const compiled={exports:{}};
 new Function('require','module','exports',outputText)(id=>mocks[id]??require(id),compiled,compiled.exports);
 return compiled.exports;
}
const withdrawal=load('../lib/withdrawal.ts');
const declaration={submissionKey:'a1234567-1234-1234-1234-123456789012',name:'Client Test',email:'client@example.invalid',contract:'Commande 123 — article standard reçu hier',address:''};
const record={...declaration,id:'123456789012345',receivedAt:'2026-10-20T12:00:00.000Z',receiptSent:false,notificationSent:false};
function route(overrides={}) {
 const calls={saved:[],sent:[],marked:[]};
 const handler=load('../app/api/retractation/route.ts',{
  '@/lib/withdrawal':withdrawal,
  '@/lib/store':{createWithdrawal:async value=>{calls.saved.push(value);return record;},markWithdrawalMail:async(...args)=>calls.marked.push(args),...overrides.store},
  '@/lib/email':{sendWithdrawalMail:async(...args)=>{calls.sent.push(args);return true;},...overrides.email},
 }).POST;
 return {calls,handler};
}
function request(body=declaration,origin='https://krearun.re') {return new Request('https://krearun.re/api/retractation',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});}
test('a declaration needs identity, contact and contract, without a login, order number or reason',()=>{
 assert.deepEqual(withdrawal.parseWithdrawal(declaration),declaration);
 for(const change of [{name:''},{email:'bad'},{contract:''},{submissionKey:'../private'}]) assert.equal(withdrawal.parseWithdrawal({...declaration,...change}),null);
 assert.equal(withdrawal.parseWithdrawal({...declaration,contract:'Achat du porte-boisson standard reçu lundi'}).contract,'Achat du porte-boisson standard reçu lundi');
});
test('a receipt contains the full declaration and the server timestamp',()=>{
 const receipt=withdrawal.withdrawalReceipt(record);
 for(const value of [record.name,record.email,record.contract,record.id,record.receivedAt]) assert.ok(receipt.includes(value));
 assert.ok(!receipt.includes('undefined'));
});
test('cross-origin, invalid and oversized submissions do not reach storage or e-mail',async()=>{
 const {calls,handler}=route();
 assert.equal((await handler(request(declaration,'https://other.invalid'))).status,403);
 assert.equal((await handler(request({...declaration,email:''}))).status,400);
 assert.equal((await handler(request({...declaration,contract:'x'.repeat(9000)}))).status,413);
 assert.equal(calls.saved.length,0);assert.equal(calls.sent.length,0);
});
test('valid requests are stored before notifications and return a downloadable durable receipt',async()=>{
 const {calls,handler}=route();const response=await handler(request());const body=await response.json();
 assert.equal(response.status,200);assert.equal(body.reference,record.id);assert.equal(body.receivedAt,record.receivedAt);assert.equal(body.emailSent,true);
 assert.equal(calls.saved.length,1);assert.equal(calls.sent.length,2);assert.equal(calls.marked.length,2);
 assert.equal(response.headers.get('cache-control'),'private, no-store');
 assert.ok(body.receipt.includes(declaration.contract));
});
test('SMTP failure does not lose a persisted withdrawal or claim an e-mail was sent',async()=>{
 const {calls,handler}=route({email:{sendWithdrawalMail:async()=>false}});const body=await(await handler(request())).json();
 assert.equal(body.ok,true);assert.equal(body.emailSent,false);assert.equal(calls.saved.length,1);assert.equal(calls.marked.length,0);assert.ok(body.receipt);
});
test('storage failure never returns a false acknowledgment or sends mail',async()=>{
 const {calls,handler}=route({store:{createWithdrawal:async()=>{throw new Error('offline');}}});
 const response=await handler(request());assert.equal(response.status,503);assert.equal(calls.sent.length,0);
});
test('retrying an acknowledged declaration does not resend either message',async()=>{
 const {calls,handler}=route({store:{createWithdrawal:async()=>({...record,receiptSent:true,notificationSent:true})}});
 assert.equal((await handler(request())).status,200);assert.equal(calls.sent.length,0);
});
