import http from 'node:http';
import {realpath} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import nextEnv from '@next/env';
import {readLibraryOpenTicket,resolveLibraryThreeMf} from '../lib/library-open-ticket.mjs';
import {DEFAULT_LIBRARY_ROOT} from './sync-library-3d.mjs';
nextEnv.loadEnvConfig(process.cwd());
const secret=process.env.AUTH_SECRET;
if(!secret)throw Error('AUTH_SECRET doit être configuré dans .env.local (identique au site).');
const root=await realpath(process.argv[2]||DEFAULT_LIBRARY_ROOT),run=promisify(execFile);
const origins=new Set(['https://krearun.re','https://www.krearun.re','http://localhost:3000','http://127.0.0.1:3000']);
const server=http.createServer(async(req,res)=>{
 const origin=req.headers.origin;
 res.setHeader('Cache-Control','no-store');
 if(!['127.0.0.1:8791','localhost:8791'].includes(req.headers.host)||!origins.has(origin)){res.writeHead(403);res.end('Origine non autorisée.');return;}
 res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');
 res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Access-Control-Allow-Private-Network','true');
 if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
 if(req.url!=='/open'||req.method!=='POST'){res.writeHead(404);res.end();return;}
 try{
  let body='';for await(const chunk of req){body+=chunk;if(body.length>16000)throw Error('Demande trop longue.');}
  const relative=readLibraryOpenTicket(secret,JSON.parse(body).ticket);
  const file=await resolveLibraryThreeMf(root,relative);
  await run('/usr/bin/open',[file],{timeout:15000});
  res.setHeader('Content-Type','application/json');res.end(JSON.stringify({ok:true}));
 }catch(error){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:error.message||'Ouverture impossible.'}));}
});
server.listen(8791,'127.0.0.1',()=>console.log('Passerelle 3MF active sur ce Mac (127.0.0.1:8791). Ouvre un fichier depuis l’admin Kréarun. Ctrl+C pour arrêter.'));
