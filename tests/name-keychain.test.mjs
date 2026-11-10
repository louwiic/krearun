import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import jscad from '@jscad/modeling';
import opentype from 'opentype.js';
import { unzipSync,strFromU8 } from 'fflate';
import { loadTs } from './load-ts.mjs';
const config=loadTs(new URL('../lib/name-keychain.ts',import.meta.url));
const geometry=loadTs(new URL('../lib/name-keychain-3d.ts',import.meta.url));
const serializer=loadTs(new URL('../lib/nameplate-3d.ts',import.meta.url));
const base={name:'Léa',font:'chewy',style:'relief',baseColor:'#542b8a',baseColorName:'Violet',textColor:'#fae933',textColorName:'Jaune'};
const fonts=new Map(config.KEYCHAIN_FONTS.map(def=>{const bytes=readFileSync(new URL('../public/fonts/'+def.file,import.meta.url));return [def.id,opentype.parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength))];}));
function signedArea(points){return points.reduce((sum,[x,y],i)=>{const n=points[(i+1)%points.length];return sum+x*n[1]-n[0]*y;},0)/2;}
test('keychains have one fixed price and only complete valid configurations are accepted',()=>{
 assert.equal(config.KEYCHAIN_PRODUCT.priceCents,1200);
 assert.equal(config.parseKeychainConfiguration({...base,priceCents:1}).name,'Léa');
 for(const override of [{name:''},{name:'<script>'},{name:'A'.repeat(19)},{font:'random'},{baseColor:'url(x)'},{style:'unsupported'}])assert.throws(()=>config.parseKeychainConfiguration({...base,...override}));
 const mono=config.parseKeychainConfiguration({...base,style:'mono'});assert.equal(mono.textColor,mono.baseColor);assert.equal(mono.textColorName,mono.baseColorName);
});
test('both colors must match a currently active inventory color, including the stored hex',()=>{
 const inventory=[{name:'PLA Violet',hex:'#542b8a',active:true},{name:'Jaune',hex:'#fae933',active:true}];
 assert.equal(config.validateKeychainColors(base,inventory).baseColorName,'Violet');
 assert.throws(()=>config.validateKeychainColors(base,[...inventory.slice(0,1),{...inventory[1],active:false}]));
 assert.throws(()=>config.validateKeychainColors({...base,textColor:'#000000'},inventory));
 assert.throws(()=>config.validateKeychainColors(base,[]));
});
test('all three fonts produce a single connected backing with a through-hole and bounded dimensions',()=>{
 for(const [fontId,font] of fonts){
  for(const style of ['mono','relief']){
   const input={...base,font:fontId,style,name:fontId==='pacifico'?'Jade':'PABLO'};
   const shapes=geometry.keychainShapes(input,font);
   assert.ok(shapes.width<=95);assert.ok(shapes.height<=32);
   const outlines=jscad.geometries.geom2.toOutlines(shapes.baseShape),areas=outlines.map(signedArea);
   const dominant=Math.sign(areas.reduce((a,b)=>Math.abs(a)>Math.abs(b)?a:b));
   assert.equal(areas.filter(a=>Math.sign(a)===dominant).length,1,`${fontId}/${style} backing must be connected`);
   assert.ok(areas.some(a=>Math.sign(a)!==dominant),'eyelet must contain a hole');
   const model=geometry.buildKeychainModel(input,font);
   assert.ok(jscad.measurements.measureVolume(model.base)>0);
   assert.ok(jscad.measurements.measureVolume(model.letters)>0);
   assert.ok(Math.abs(model.depth-3.6)<1e-5);
  }
 }
});
test('accents, short names and names containing spaces are supported',()=>{
 for(const name of ['Éloïse','Mia','Jean Luc','Jean-Pierre']){
  const shapes=geometry.keychainShapes({...base,name},fonts.get('chewy'));
  assert.ok(shapes.width<=95);assert.ok(shapes.height<=32);
 }
});
test('3MF carries both selected colors, closed meshes and a real eyelet bore',()=>{
 const model=geometry.buildKeychainModel({...base,name:'PABLO'},fonts.get('chewy'));
 const archive=unzipSync(serializer.serializeNameplate3mf(model,{base:base.baseColor,letters:base.textColor}));
 const xml=strFromU8(archive['3D/3dmodel.model']);assert.match(xml,/unit="millimeter"/);assert.match(xml,/#542B8AFF/);assert.match(xml,/#FAE933FF/);
 for(const object of xml.matchAll(/<object[^>]*>(.*?)<\/object>/gs)){
  const edges=new Map();
  for(const triangle of object[1].matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"\/>/g)){
   const ids=triangle.slice(1).map(Number);
   for(let i=0;i<3;i++){const edge=[ids[i],ids[(i+1)%3]].sort((a,b)=>a-b).join(':');edges.set(edge,(edges.get(edge)||0)+1);}
  }
  assert.ok(edges.size>50);assert.equal([...edges.values()].filter(count=>count!==2).length,0,'printable meshes must be watertight');
 }
});

test('font coordinates keep the P counter in the upper half of the printed object',()=>{
 const shapes=geometry.keychainShapes({...base,name:'P'},fonts.get('chewy'));
 const outlines=jscad.geometries.geom2.toOutlines(shapes.lettersShape),areas=outlines.map(signedArea);
 const outerIndex=areas.reduce((largest,a,i)=>Math.abs(a)>Math.abs(areas[largest])?i:largest,0),outer=outlines[outerIndex];
 const hole=outlines.find((_,i)=>Math.sign(areas[i])!==Math.sign(areas[outerIndex]));assert.ok(hole);
 const center=points=>(Math.min(...points.map(p=>p[1]))+Math.max(...points.map(p=>p[1])))/2;
 assert.ok(center(hole)>center(outer),'manufacturing Y must point up, not mirror the printed name');
 assert.ok(Number.isFinite(shapes.previewFlipY));
});
