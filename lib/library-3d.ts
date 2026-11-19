import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {unzipSync} from 'fflate';
import {downloadLibrarySnapshot} from './store';
export type LibraryEntry={path:string;parent:string;name:string;kind:'file'|'directory'|'symlink';size:number;modified:string;target?:string;previewId?:string};
export type LibraryProject={path:string;name:string;category:string;description:string;preview:string;previewId:string;previewFile?:string};
export type LibraryManifest={version:number;root:string;scannedAt:string;entries:LibraryEntry[];projects:LibraryProject[];filePreviews?:Record<string,{previewId:string;previewFile:string}>};
export const libraryAssets=()=>path.join(process.cwd(),'assets/library-3d');
let cached: {mtime:number;value:Promise<LibraryManifest>} | undefined;
let remote:{expires:number;files:Promise<Record<string,Uint8Array>>;manifest?:LibraryManifest}|undefined;
async function remoteFiles(){
 if(!remote || Date.now()>remote.expires)remote={expires:Date.now()+60000,files:downloadLibrarySnapshot().then(bytes=>unzipSync(bytes)).catch(error=>{remote=undefined;throw error;})};
 return remote.files;
}
export async function readLibrary():Promise<LibraryManifest>{
 const filename=path.join(libraryAssets(),'manifest.json');
 try{
  const info=await stat(filename);
  if(!cached || cached.mtime!==info.mtimeMs)cached={mtime:info.mtimeMs,value:readFile(filename,'utf8').then(text=>JSON.parse(text) as LibraryManifest).catch(error=>{cached=undefined;throw error;})};
  return cached.value;
 }catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
 const bytes=(await remoteFiles())['manifest.json'];
 if(!bytes)throw new Error('Inventaire privé introuvable.');
 if(remote?.manifest)return remote.manifest;
 const manifest=JSON.parse(new TextDecoder().decode(bytes)) as LibraryManifest;
 if(remote)remote.manifest=manifest;
 return manifest;
}
export async function libraryAsset(name:string):Promise<Uint8Array>{
 try{return await readFile(path.join(libraryAssets(),name));}
 catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
 const bytes=(await remoteFiles())[name];if(!bytes)throw new Error('Document privé introuvable.');return bytes;
}
export function libraryView(data:LibraryManifest,{folder='',query='',page=1}:{folder?:string;query?:string;page?:number}={}){
 if(folder && !data.entries.some(e=>e.kind==='directory'&&e.path===folder))throw new Error('Dossier introuvable dans cet inventaire.');
 const needle=query.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const filtered=data.entries.filter(e=>needle?e.path.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(needle):e.parent===folder)
 .sort((a,b)=>Number(b.kind==='directory')-Number(a.kind==='directory')||a.path.localeCompare(b.path,'fr',{numeric:true}));
 const current=Math.max(1,Math.min(Math.ceil(filtered.length/80)||1,Math.floor(page)||1));
 return {folder,query,total:filtered.length,page:current,pages:Math.max(1,Math.ceil(filtered.length/80)),entries:filtered.slice((current-1)*80,current*80).map(entry=>({...entry,previewId:data.filePreviews?.[entry.path]?.previewId||data.projects?.find(p=>p.path===entry.path)?.previewId}))};
}
export function macOpenCommand(absolutePath:string){return `open -- '${absolutePath.replace(/'/g,"'\\''")}'`;}
