import path from 'node:path';
import {realpath,stat} from 'node:fs/promises';
import {createHmac,timingSafeEqual} from 'node:crypto';
function signature(secret,payload){return createHmac('sha256',secret).update('krearun-library-open-v1\n'+payload).digest('base64url');}
export function createLibraryOpenTicket(secret,relativePath,now=Date.now()){
 const payload=Buffer.from(JSON.stringify({path:relativePath,expires:now+60000})).toString('base64url');return `${payload}.${signature(secret,payload)}`;
}
export function readLibraryOpenTicket(secret,token,now=Date.now()){
 if(typeof token!=='string'||token.length>12000)throw Error('Autorisation invalide.');
 const [payload,mac,...extra]=token.split('.');if(!payload||!mac||extra.length)throw Error('Autorisation invalide.');
 const expected=Buffer.from(signature(secret,payload)),actual=Buffer.from(mac);
 if(expected.length!==actual.length||!timingSafeEqual(expected,actual))throw Error('Autorisation invalide.');
 const data=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));
 if(!Number.isFinite(data.expires)||data.expires<now||data.expires>now+60000||typeof data.path!=='string'||!data.path.toLowerCase().endsWith('.3mf'))throw Error('Autorisation expirée ou fichier invalide.');
 return data.path;
}

export async function resolveLibraryThreeMf(root,relative){
 if(typeof relative!=='string'||path.isAbsolute(relative)||relative.split(/[\\/]/).includes('..'))throw Error('Chemin refusé.');
 const library=await realpath(root),file=await realpath(path.join(library,relative));
 if(!file.startsWith(library+path.sep)||!file.toLowerCase().endsWith('.3mf')||!(await stat(file)).isFile())throw Error('Le 3MF est absent de la bibliothèque ou pointe vers un autre dossier.');
 return file;
}
