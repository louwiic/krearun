import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import jscad from '@jscad/modeling';
import { unzipSync,strFromU8 } from 'fflate';
import { loadTs } from './load-ts.mjs';
const {CLICKER_ELEMENTS,clickerElement,clickerCharacters}=loadTs(new URL('../lib/clicker-elements.ts',import.meta.url));
const {parseElementKeychain,elementKeychainShapes,buildElementKeychain}=loadTs(new URL('../lib/element-keychain.ts',import.meta.url));
const {serializeNameplate3mf,serializeNameplate}=loadTs(new URL('../lib/nameplate-3d.ts',import.meta.url));
const colors={baseColor:'#752852',baseColorName:'Violet',textColor:'#ffffff',textColorName:'Blanc'};
const config=elements=>({elements,colors});
function area(r){return r.reduce((s,p,i)=>{const q=r[(i+1)%r.length];return s+p[0]*q[1]-q[0]*p[1];},0)/2;}
test('all 93 native objects have an exact glyph catalog entry and a real 3D preview',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../public/models/clicker/manifest.json',import.meta.url)));
 assert.equal(CLICKER_ELEMENTS.length,93);assert.equal(new Set(CLICKER_ELEMENTS.map(e=>e.sourceName)).size,93);
 for(const e of CLICKER_ELEMENTS){assert.ok(e.contours.length);assert.equal(manifest.caps[e.id].sourceName,e.sourceName);assert.ok(existsSync(new URL('../public/models/clicker/'+manifest.caps[e.id].file,import.meta.url)));assert.equal(clickerElement(e.value)?.id,e.id);}
 assert.equal(clickerElement('é').id,'e_acute_accent');assert.equal(clickerCharacters('é🦆').length,2);assert.equal(clickerElement('✦'),undefined);
});
test('catalog rejects unknown elements, oversized compositions and invalid colors',()=>{
 for(const v of [null,config([]),config(['not-found']),config(Array(9).fill('star')),{elements:['star'],colors:{...colors,baseColor:'red'}}])assert.throws(()=>parseElementKeychain(v));
});
test('every native element has one connected backing and a real 4 mm through-hole',()=>{
 for(const item of CLICKER_ELEMENTS){
  const shapes=elementKeychainShapes(config([item.id]));
  assert.ok(shapes.width<=95 && shapes.height<=32,item.id);
  const outlines=jscad.geometries.geom2.toOutlines(shapes.baseShape),areas=outlines.map(area),sign=Math.sign(areas.reduce((a,b)=>Math.abs(a)>Math.abs(b)?a:b));
  assert.equal(areas.filter(a=>Math.sign(a)===sign).length,1,item.id+' disconnected backing');
  assert.ok(outlines.some((r,i)=>Math.sign(areas[i])!==sign && Math.abs(Math.max(...r.map(p=>p[0]))-Math.min(...r.map(p=>p[0]))-4)<.02),item.id+' missing hole');
  const model=buildElementKeychain(config([item.id]));assert.ok(jscad.measurements.measureVolume(model.base)>0);assert.ok(jscad.measurements.measureVolume(model.letters)>0);
 }
});
test('mixed names, numbers, accents and island motifs export watertight color meshes',async()=>{
 const samples=[['paw'],['coffee'],['star','N','E','L','L'],['e_acute_accent','2','0','2','6','moon'],Array(8).fill('flower')];
 const out=new URL('../outputs/clicker-elements-2026-11-19/',import.meta.url);mkdirSync(out,{recursive:true});
 for(const elements of samples){
  const model=buildElementKeychain(config(elements)),file=serializeNameplate3mf(model,{base:colors.baseColor,letters:colors.textColor});
  const xml=strFromU8(unzipSync(file)['3D/3dmodel.model']);assert.match(xml,/#752852FF/);assert.match(xml,/#FFFFFFFF/);
  for(const object of xml.matchAll(/<object[^>]*>(.*?)<\/object>/gs)){
   const edges=new Map();for(const tri of object[1].matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"\/>/g)){const ids=tri.slice(1).map(Number);for(let i=0;i<3;i++){const edge=[ids[i],ids[(i+1)%3]].sort((a,b)=>a-b).join(':');edges.set(edge,(edges.get(edge)||0)+1);}}
   assert.equal([...edges.values()].filter(n=>n!==2).length,0,elements.join(',')+' not watertight');
  }
  writeFileSync(new URL(elements[0]+'.3mf',out),file);
  const bytes=new Uint8Array(await new Blob(serializeNameplate(model.combined)).arrayBuffer());writeFileSync(new URL(elements[0]+'.stl',out),bytes);
 }
});

test('admin generation rejects anonymous callers, malformed payloads and unavailable colors',async()=>{
 let admin=false,calls=0;
 const route=loadTs(new URL('../app/api/admin/keychains/elements/route.ts',import.meta.url),{
  '@/lib/auth':{isAdmin:async()=>admin},
  '@/lib/store':{getInventoryColors:async()=>[{name:'Violet',hex:'#752852',active:true},{name:'Blanc',hex:'#ffffff',active:true}]},
  '@/lib/name-keychain':loadTs(new URL('../lib/name-keychain.ts',import.meta.url)),
  '@/lib/element-keychain':{buildElementKeychain,parseElementKeychain},
  '@/lib/nameplate-3d':{serializeNameplate,serializeNameplate3mf},
  '@/lib/element-keychain-3mf':loadTs(new URL('../lib/element-keychain-3mf.ts',import.meta.url)),
 });
 let res=await route.POST({json:()=>{calls++;throw Error('must not read');}});assert.equal(res.status,401);assert.equal(calls,0);
 admin=true;
 const post=body=>route.POST({json:async()=>body});
 assert.equal((await post({configuration:config(['unknown']),format:'3mf'})).status,400);
 assert.equal((await post({configuration:config(['star']),format:'svg'})).status,400);
 assert.equal((await post({configuration:{...config(['star']),colors:{...colors,baseColor:'#000000'}},format:'3mf'})).status,400);
 for(const format of ['3mf','stl']){
  res=await post({configuration:config(['paw','2']),format});assert.equal(res.status,200);assert.equal(res.headers.get('cache-control'),'private, no-store');
  const bytes=new Uint8Array(await res.arrayBuffer());if(format==='3mf')writeFileSync(new URL('../outputs/clicker-elements-2026-11-19/admin-paw-2.3mf',import.meta.url),bytes);
  const archive=unzipSync(bytes);if(format==='3mf'){const xml=strFromU8(archive['3D/3dmodel.model']);assert.match(xml,/<component objectid="2"/);assert.match(xml,/<item objectid="4"/);}
  assert.ok(archive[format==='3mf'?'Metadata/krearun-elements.json':'configuration.json']);
 }
});
