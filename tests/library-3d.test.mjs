import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,mkdir,symlink,rm,readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {scanLibrary} from '../scripts/sync-library-3d.mjs';
import {loadTs} from './load-ts.mjs';
const library=loadTs(new URL('../lib/library-3d.ts',import.meta.url),{'./store':{}});
const client=loadTs(new URL('../lib/library-3d-client.ts',import.meta.url));
test('scan includes hidden files, root documents, empty folders and unindexed projects without following symlinks',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'library-test-'));
 try{
  await mkdir(path.join(root,'Cat','Projet'),{recursive:true});await mkdir(path.join(root,'Vide'));
  await writeFile(path.join(root,'Cat','Projet','.hidden'),'x');await writeFile(path.join(root,'Cat','Projet','model.stl'),'x');
  await writeFile(path.join(root,'INDEX.html'),'<article><img src="Cat/Projet/apercu.jpg"><h2>Projet &amp; modèle</h2><p>Description.</p></article>');
  await writeFile(path.join(root,'Cat','Projet','apercu.jpg'),'preview');await symlink(os.tmpdir(),path.join(root,'Lien'));
  const data=await scanLibrary(root);
  assert.equal(data.entries.length,8);assert.equal(data.entries.find(e=>e.name==='Lien').kind,'symlink');
  assert.ok(data.entries.some(e=>e.name==='.hidden'));assert.ok(data.entries.some(e=>e.path==='Vide'));
  assert.equal(data.projects[0].name,'Projet & modèle');assert.equal(data.projects[0].path,'Cat/Projet');
 }finally{await rm(root,{recursive:true,force:true});}
});
test('complete snapshot contains all library entries and project previews',{skip:!existsSync(new URL('../assets/library-3d/manifest.json',import.meta.url))},async()=>{
 const snapshot=JSON.parse(await readFile(new URL('../assets/library-3d/manifest.json',import.meta.url),'utf8'));
 assert.ok(snapshot.entries.filter(e=>e.kind!=='directory').length>=14928);
 assert.equal(snapshot.projects.length,148);
 assert.ok(snapshot.entries.some(e=>e.path==='INDEX.html'));
 assert.ok(snapshot.entries.some(e=>e.path.startsWith('Journal_du_classement/')));
 assert.ok(snapshot.entries.some(e=>e.path.startsWith('porte_boisson/')));
 assert.ok(snapshot.projects.some(p=>p.name.includes('GTA')));
 for(const project of snapshot.projects)assert.ok((await readFile(new URL('../assets/library-3d/previews/'+project.previewFile,import.meta.url))).length>0);
});
test('explorer paginates large results, matches accents and rejects arbitrary folder paths',()=>{
 const entries=Array.from({length:161},(_,i)=>({path:`Cat/fichier-${i}.stl`,parent:'Cat',name:`fichier-${i}.stl`,kind:'file'}));
 const data={entries:[{path:'Cat',parent:'',name:'Cat',kind:'directory'},...entries,{path:'Cat/Prénom.stl',parent:'Cat',name:'Prénom.stl',kind:'file'}]};
 assert.equal(library.libraryView(data,{folder:'Cat'}).entries.length,80);
 assert.equal(library.libraryView(data,{folder:'Cat',page:3}).entries.length,2);
 assert.equal(library.libraryView(data,{query:'prenom'}).total,1);
 assert.throws(()=>library.libraryView(data,{folder:'../../etc'}));
});
test('Finder command quotes spaces, apostrophes and shell substitutions literally',()=>{
 assert.equal(client.macOpenCommand("/Users/loic/3D/l'atelier $(echo danger)"),"open -- '/Users/loic/3D/l'\\''atelier $(echo danger)'");
});
test('all library endpoints require the existing admin session',async()=>{
 for(const endpoint of ['route.ts','preview/route.ts','document/route.ts']){
  const api=loadTs(new URL('../app/api/admin/library-3d/'+endpoint,import.meta.url),{'@/lib/auth':{isAdmin:async()=>false},'@/lib/library-3d':{}});
  assert.equal((await api.GET(new Request('http://localhost/api/admin/library-3d'))).status,401);
 }
});

test('Mac launch tickets expire, cannot be modified, and only authorize the requested 3MF',async()=>{
 const {createLibraryOpenTicket,readLibraryOpenTicket}=await import('../lib/library-open-ticket.mjs');
 const now=Date.now(),ticket=createLibraryOpenTicket('test-secret','Cat/Prénom.3mf',now);
 assert.equal(readLibraryOpenTicket('test-secret',ticket,now),'Cat/Prénom.3mf');
 assert.throws(()=>readLibraryOpenTicket('wrong-secret',ticket,now));
 assert.throws(()=>readLibraryOpenTicket('test-secret',ticket,now+60001));
 assert.throws(()=>readLibraryOpenTicket('test-secret',ticket+'x',now));
 assert.throws(()=>readLibraryOpenTicket('test-secret',createLibraryOpenTicket('test-secret','other.txt',now),now));
});
test('native opening rejects traversal, non-3MF files, and symlinks outside the library',async()=>{
 const {resolveLibraryThreeMf}=await import('../lib/library-open-ticket.mjs');
 const root=await mkdtemp(path.join(os.tmpdir(),'3mf-root-')),outside=await mkdtemp(path.join(os.tmpdir(),'3mf-outside-'));
 try{
  await writeFile(path.join(root,'model.3mf'),'model');await writeFile(path.join(root,'notes.txt'),'text');await writeFile(path.join(outside,'secret.3mf'),'outside');await symlink(path.join(outside,'secret.3mf'),path.join(root,'escape.3mf'));
  assert.equal(await resolveLibraryThreeMf(root,'model.3mf'),path.join(await import('node:fs/promises').then(m=>m.realpath(root)),'model.3mf'));
  await assert.rejects(resolveLibraryThreeMf(root,'notes.txt'));await assert.rejects(resolveLibraryThreeMf(root,'../outside.3mf'));await assert.rejects(resolveLibraryThreeMf(root,'escape.3mf'));
 }finally{await rm(root,{recursive:true,force:true});await rm(outside,{recursive:true,force:true});}
});
test('deployed library reads the protected archive when the Mac snapshot directory is absent',async()=>{
 const {zipSync,strToU8}=await import('fflate');let downloads=0;
 const archive=zipSync({'manifest.json':strToU8(JSON.stringify({root:'/private/library',projects:[],entries:[]})),'previews/example.jpg':new Uint8Array([1,2]),'rangement-report.html':strToU8('Bilan privé')});
 const missing=async()=>{throw Object.assign(new Error('absent'),{code:'ENOENT'});};
 const deployed=loadTs(new URL('../lib/library-3d.ts',import.meta.url),{'node:fs/promises':{stat:missing,readFile:missing},'./store':{downloadLibrarySnapshot:async()=>{downloads++;return archive;}}});
 assert.equal((await deployed.readLibrary()).root,'/private/library');
 assert.deepEqual([...await deployed.libraryAsset('previews/example.jpg')],[1,2]);
 assert.equal(new TextDecoder().decode(await deployed.libraryAsset('rangement-report.html')),'Bilan privé');
 assert.equal(downloads,1);
});
test('file explorer includes embedded 3MF thumbnail references and project folder previews',()=>{
 const data={entries:[{path:'Cat',parent:'',name:'Cat',kind:'directory'},{path:'Cat/model.3mf',parent:'Cat',name:'model.3mf',kind:'file'}],projects:[{path:'Cat',previewId:'project-thumb'}],filePreviews:{'Cat/model.3mf':{previewId:'file-thumb',previewFile:'file-thumb.webp'}}};
 assert.equal(library.libraryView(data,{folder:'Cat'}).entries[0].previewId,'file-thumb');
 assert.equal(library.libraryView(data).entries[0].previewId,'project-thumb');
});
test('protected preview route serves embedded file images as WebP',async()=>{
 const api=loadTs(new URL('../app/api/admin/library-3d/preview/route.ts',import.meta.url),{'@/lib/auth':{isAdmin:async()=>true},'@/lib/library-3d':{readLibrary:async()=>({projects:[],filePreviews:{'model.3mf':{previewId:'file-thumb',previewFile:'file-thumb.webp'}}}),libraryAsset:async name=>{assert.equal(name,'previews/file-thumb.webp');return new Uint8Array([1,2,3]);}}});
 const response=await api.GET(new Request('http://localhost/api/admin/library-3d/preview?id=file-thumb'));
 assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/webp');assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],[1,2,3]);
});
