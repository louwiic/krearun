import {readdir,lstat,readFile,writeFile,mkdir,readlink,realpath,copyFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import env from '@next/env';
import {zipSync} from 'fflate';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
export const DEFAULT_LIBRARY_ROOT=path.join(os.homedir(),'3D','Bibliotheque_3D');
const decode=s=>s.replace(/&(?:amp|lt|gt|quot|#39|apos);/g,m=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&apos;':"'"}[m])).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));
export async function scanLibrary(root=DEFAULT_LIBRARY_ROOT){
 const entries=[];
 async function visit(dir=''){
  for(const item of (await readdir(path.join(root,dir),{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name,'fr'))){
   const relative=dir?`${dir}/${item.name}`:item.name,absolute=path.join(root,relative),stat=await lstat(absolute);
   const kind=stat.isSymbolicLink()?'symlink':stat.isDirectory()?'directory':'file';
   entries.push({path:relative,parent:dir,name:item.name,kind,size:stat.size,modified:stat.mtime.toISOString(),...(kind==='symlink'?{target:await readlink(absolute)}:{})});
   if(kind==='directory')await visit(relative);
  }
 }
 await visit();
 const html=await readFile(path.join(root,'INDEX.html'),'utf8');
 const projects=[];
 for(const match of html.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/g)){
  const content=match[1],image=content.match(/<img\b[^>]*src="([^"]+)"/),title=content.match(/<h2>([\s\S]*?)<\/h2>/),description=content.match(/<h2>[\s\S]*?<\/h2><p>([\s\S]*?)<\/p>/);
  if(!image||!title)continue;
  const preview=decodeURIComponent(decode(image[1]));const relative=path.posix.dirname(preview);
  if(!entries.some(e=>e.path===relative&&e.kind==='directory'))continue;
  projects.push({path:relative,name:decode(title[1].replace(/<[^>]+>/g,'')),category:relative.split('/')[0],description:decode((description?.[1]||'').replace(/<[^>]+>/g,'')),preview,previewId:createHash('sha256').update(relative).digest('hex').slice(0,24)});
 }
 return {version:1,root,scannedAt:new Date().toISOString(),entries,projects};
}
export async function syncLibrary(root=DEFAULT_LIBRARY_ROOT,destination=path.resolve('assets/library-3d')){
 const manifest=await scanLibrary(root);await mkdir(path.join(destination,'previews'),{recursive:true});
 for(const project of manifest.projects){
  const image=await realpath(path.join(root,project.preview));
  if(!image.startsWith((await realpath(root))+path.sep))throw Error('Aperçu hors bibliothèque');
  const ext=path.extname(image).toLowerCase();project.previewFile=project.previewId+ext;
  await copyFile(image,path.join(destination,'previews',project.previewFile));
 }
 await writeFile(path.join(destination,'manifest.json'),JSON.stringify(manifest));
 await copyFile(path.join(root,'INDEX.html'),path.join(destination,'original-index.html'));
 await copyFile(path.join(root,'Journal_du_classement/20261119_Rangement/RAPPORT.html'),path.join(destination,'rangement-report.html'));
 return manifest;
}
export async function publishLibrary(destination=path.resolve('assets/library-3d')){
 env.loadEnvConfig(process.cwd());
 const base=process.env.POCKETBASE_URL?.replace(/\/$/,'');
 if(!base)throw Error('POCKETBASE_URL manquant.');
 const login=await fetch(base+'/api/collections/_superusers/auth-with-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identity:process.env.POCKETBASE_ADMIN_EMAIL,password:process.env.POCKETBASE_ADMIN_PASSWORD})});
 if(!login.ok)throw Error('Authentification de synchronisation impossible.');const {token}=await login.json();
 async function api(url,method='GET',body){const response=await fetch(base+'/api'+url,{method,headers:{Authorization:token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});if(!response.ok)throw Error(`Stockage privé : ${response.status}`);return response.json();}
 const matches=await api('/collections?filter='+encodeURIComponent("name='library_snapshots'"));
 let schema=matches.items[0];
 if(!schema)schema=await api('/collections','POST',{name:'library_snapshots',type:'base',listRule:null,viewRule:null,createRule:null,updateRule:null,deleteRule:null,fields:[{name:'label',type:'text'},{name:'bundle',type:'file',maxSelect:1,maxSize:32*1024*1024,protected:true},{name:'created',type:'autodate',onCreate:true,onUpdate:false}]});
 if(['listRule','viewRule','createRule','updateRule','deleteRule'].some(rule=>schema[rule]!==null)||!schema.fields.some(f=>f.name==='bundle'&&f.protected))throw Error('Le stockage doit être strictement privé.');
 const files={};for(const name of ['manifest.json','rangement-report.html','original-index.html'])files[name]=new Uint8Array(await readFile(path.join(destination,name)));
 for(const name of await readdir(path.join(destination,'previews')))files['previews/'+name]=new Uint8Array(await readFile(path.join(destination,'previews',name)));
 const zip=zipSync(files,{level:6});const form=new FormData();form.set('label','Bibliothèque 3D '+new Date().toISOString());form.set('bundle',new Blob([new Uint8Array(zip)],{type:'application/zip'}),'bibliotheque-3d.zip');
 const uploaded=await fetch(base+'/api/collections/library_snapshots/records',{method:'POST',headers:{Authorization:token},body:form});if(!uploaded.ok)throw Error('Échec de la sauvegarde privée.');
 const record=await uploaded.json();return {id:record.id,bytes:zip.length};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 const data=await syncLibrary(process.argv[2]||DEFAULT_LIBRARY_ROOT);
 const upload=await publishLibrary();
 console.log(JSON.stringify({projects:data.projects.length,files:data.entries.filter(e=>e.kind!=='directory').length,folders:data.entries.filter(e=>e.kind==='directory').length,scannedAt:data.scannedAt,privateSnapshot:upload.id,bytes:upload.bytes}));
}
