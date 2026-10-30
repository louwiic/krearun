import test from 'node:test';
import assert from 'node:assert/strict';
import { zipSync, strToU8 } from 'fflate';
import { validatePrintFile, printFileDisposition } from '../lib/print-files.ts';
const model=zipSync({'[Content_Types].xml':strToU8('<Types/>'),'3D/3dmodel.model':strToU8('<model/>')});
test('accepts a 3MF project without modifying its original bytes',()=>{
 const original=Buffer.from(model);validatePrintFile('Moule complet.3mf',model);assert.deepEqual(Buffer.from(model),original);
});
test('rejects renamed archives, invalid data, empty and oversized files',()=>{
 assert.throws(()=>validatePrintFile('photo.zip',model),/3mf/);
 assert.throws(()=>validatePrintFile('fake.3mf',zipSync({'photo.jpg':strToU8('x')})),/valide/);
 assert.throws(()=>validatePrintFile('fake.3mf',strToU8('broken')),/illisible/);
 assert.throws(()=>validatePrintFile('fake.3mf',new Uint8Array()),/100 Mo/);
 assert.throws(()=>validatePrintFile('fake.3mf',new Uint8Array(100*1024*1024+1)),/100 Mo/);
});
test('download filenames cannot inject headers and support French characters',()=>{
 const h=printFileDisposition('Étoile\r\nX-Evil: yes.3mf');
 assert.ok(!/[\r\n]/.test(h));assert.match(h,/filename\*=UTF-8''%C3%89toile/);assert.match(h,/^attachment;/);
});

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
function loadRoute(path,mocks){const source=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;const mod={exports:{}};new Function('require','module','exports',source)(name=>mocks[name]??require(name),mod,mod.exports);return mod.exports;}
test('download denies anonymous visitors before reading storage and streams only for an admin',async()=>{
 let admin=false,reads=0;
 const route=loadRoute('../app/api/admin/print-files/[id]/route.ts',{'@/lib/auth':{isAdmin:async()=>admin},'@/lib/store':{downloadProductPrintFile:async id=>{reads++;return id==='missing'?null:{record:{originalName:'Étoile.3mf',sizeBytes:model.length},response:new Response(model)};}},'@/lib/print-files':{printFileDisposition}});
 let response=await route.GET(new Request('https://krearun.re/api/admin/print-files/file'),{params:Promise.resolve({id:'file'})});
 assert.equal(response.status,401);assert.equal(reads,0);assert.equal(response.headers.get('Cache-Control'),'private, no-store');
 admin=true;response=await route.GET(new Request('https://krearun.re/'),{params:Promise.resolve({id:'missing'})});assert.equal(response.status,404);
 response=await route.GET(new Request('https://krearun.re/'),{params:Promise.resolve({id:'valid'})});assert.equal(response.status,200);assert.deepEqual(new Uint8Array(await response.arrayBuffer()),model);assert.equal(response.headers.get('X-Content-Type-Options'),'nosniff');assert.match(response.headers.get('Content-Disposition'),/^attachment/);
});
test('upload checks authentication, origin and body size before any write',async()=>{
 let admin=false,writes=0;
 const route=loadRoute('../app/api/admin/print-files/route.ts',{'@/lib/auth':{isAdmin:async()=>admin},'@/lib/store':{addProductPrintFile:async()=>{writes++;}},'@/lib/print-files':{MAX_PRINT_FILE_BYTES:100*1024*1024},'@/lib/custom-holder-http':{holderSiteUrl:()=> 'https://krearun.re'}});
 const req=(headers={})=>new Request('https://krearun.re/api/admin/print-files',{method:'POST',headers});
 assert.equal((await route.POST(req())).status,401);admin=true;
 assert.equal((await route.POST(req({origin:'https://evil.example'}))).status,403);
 assert.equal((await route.POST(req({origin:'https://krearun.re','content-length':String(101*1024*1024)}))).status,413);
 assert.equal((await route.POST(req({origin:'https://krearun.re'}))).status,400);assert.equal(writes,0);
 const data=new FormData();data.set('productId','mmlrj3qnq1w4hjm');data.set('file',new File([model],'valid.3mf'));
 const good=new Request('http://internal:3000/api/admin/print-files',{method:'POST',headers:{origin:'https://krearun.re'},body:data});
 assert.equal((await route.POST(good)).status,200);assert.equal(writes,1);
});
