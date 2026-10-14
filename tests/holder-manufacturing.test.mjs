import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createRequire} from 'node:module';
import sharp from 'sharp';
import Module from 'manifold-3d';
import {DOMParser} from '@xmldom/xmldom';
import {unzipSync,strFromU8} from 'fflate';
import ts from 'typescript';
import {buildHolderManufacturing,maskContours,manufacturingOptions} from '../lib/holder-manufacturing.mjs';
const require=createRequire(import.meta.url);
function load(path,mocks={}){const source=readFileSync(new URL(path,import.meta.url),'utf8');const {outputText}=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}});const compiled={exports:{}};new Function('require','module','exports',outputText)(name=>mocks[name]??require(name),compiled,compiled.exports);return compiled.exports;}
const configuration={model:'custom',bodyColor:'#171717',bodyColorName:'noir',logoWidth:40,logoOffset:0};
function parse(file){const archive=unzipSync(file);const root=new DOMParser().parseFromString(strFromU8(archive['3D/3dmodel.model']),'application/xml');const objects=Array.from(root.getElementsByTagName('object'));const meshes=objects.filter(o=>o.getElementsByTagName('mesh').length);const report=JSON.parse(strFromU8(archive['Metadata/krearun-fabrication.json']));return {archive,root,objects,meshes,report};}
function meshData(object){return {vertices:new Float32Array(Array.from(object.getElementsByTagName('vertex')).flatMap(v=>['x','y','z'].map(k=>Number(v.getAttribute(k))))),triangles:new Uint32Array(Array.from(object.getElementsByTagName('triangle')).flatMap(v=>['v1','v2','v3'].map(k=>Number(v.getAttribute(k)))))};}
const palette=['#ff0000','#00ff00','#0000ff','#ffff00'];
let exported;
test('a four-color PNG produces a manifold pocketed body and a flat multi-material logo with holes',async()=>{
 const width=48,height=48,raw=Buffer.alloc(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const distance=Math.hypot(x-23.5,y-23.5);if(distance>20||distance<8)continue;const rgb=[[255,0,0],[0,255,0],[0,0,255],[255,255,0]][(x>=24?1:0)+(y>=24?2:0)];raw.set([...rgb,255],(y*width+x)*4);}
 const logo=await sharp(raw,{raw:{width,height,channels:4}}).png().toBuffer();
 exported=await buildHolderManufacturing({requestId:'test',configuration,palette,logo});const parsed=parse(exported.file);
 assert.equal(parsed.root.documentElement.getAttribute('unit'),'millimeter');assert.equal(parsed.root.getElementsByTagName('base').length,5);assert.equal(parsed.root.getElementsByTagName('item').length,5);assert.equal(parsed.meshes.length,8);
 const wasm=await Module();wasm.setup();let body;
 for(const object of parsed.meshes){const data=meshData(object);const solid=new wasm.Manifold(new wasm.Mesh({numProp:3,vertProperties:data.vertices,triVerts:data.triangles}));assert.equal(solid.status(),'NoError',object.getAttribute('name'));assert.ok(solid.volume()>0);if(object.getAttribute('name').startsWith('Cylindre'))body=solid;
  if(object.getAttribute('name').startsWith('Logo')){assert.ok(solid.boundingBox().min[2]>=0);assert.ok(solid.boundingBox().max[2]<=1.00001);}}
 assert.ok(parsed.report.checks.removedVolumeMm3>0);assert.ok(parsed.report.checks.insertBodyOverlapMm3<=.02);assert.equal(parsed.report.settings.remainingWallMm,1.33);assert.ok(Math.abs(parsed.report.logoBoundsMm.flatWidth-40*38.25/38.65)<1e-9);
 const template=JSON.parse(gunzipSync(readFileSync(new URL('../assets/holder-manufacturing/custom.json.gz',import.meta.url))));const original=template.objects.find(o=>o.plate===4).parts[0];const originalBody=new wasm.Manifold(new wasm.Mesh({numProp:3,vertProperties:new Float32Array(original.vertices),triVerts:new Uint32Array(original.triangles)}));
 for(const z of [-69.5,69.5]){const region=wasm.Manifold.cube([100,100,19],true).translate([0,0,z]);assert.ok(Math.abs(originalBody.intersect(region).volume()-body.intersect(region).volume())<.2,'thread geometry retained');}
 const plate=parsed.objects.find(o=>o.getAttribute('name')==='Logo multicolore à plat — à coller');assert.equal(plate.getElementsByTagName('component').length,4);
});
test('contours keep holes and diagonal disconnected pixels instead of filling transparent areas',async()=>{
 const wasm=await Module();wasm.setup();const ring=new Uint8Array([1,1,1,1,0,1,1,1,1]);const contours=maskContours(ring,3,3,1,1);assert.equal(new wasm.CrossSection(contours,'EvenOdd').area(),8);
 const diagonal=maskContours(new Uint8Array([1,0,0,1]),2,2,1,1);assert.equal(diagonal.length,2);assert.equal(new wasm.CrossSection(diagonal,'EvenOdd').area(),2);
});
test('unsafe fit settings and a logo entering the thread zone are refused',async()=>{
 for(const options of [{depth:1,thickness:.8},{clearance:1},{depth:NaN},{thickness:100}])assert.throws(()=>manufacturingOptions(options));
 const logo=await sharp({create:{width:40,height:80,channels:4,background:{r:255,g:0,b:0,alpha:1}}}).png().toBuffer();
 await assert.rejects(buildHolderManufacturing({requestId:'test',configuration:{...configuration,logoWidth:65,logoOffset:25},palette:['#ff0000'],logo}),/filetages/);
});
test('OM and Arsenal retain their exact manufacturing meshes while replacing all body and logo colors',async()=>{
 for(const model of ['om','arsenal']){
  const colors=model==='om'?['#ff0000','#00ff00']:palette;
  const result=await buildHolderManufacturing({requestId:'test',configuration:{...configuration,model,logoColors:colors},palette:[...new Set(colors)]});const parsed=parse(result.file);
  const source=JSON.parse(gunzipSync(readFileSync(new URL(`../assets/holder-manufacturing/${model}.json.gz`,import.meta.url))));assert.equal(parsed.root.getElementsByTagName('item').length,source.objects.length);
  const sourceTriangles=source.objects.flatMap(o=>o.parts).reduce((n,p)=>n+p.triangles.length/3,0);const actual=parsed.meshes.reduce((n,p)=>n+p.getElementsByTagName('triangle').length,0);assert.equal(actual,sourceTriangles);assert.ok(actual>180000);assert.equal(parsed.report.settings.sourceGeometryUnchanged,true);
  const materials=Array.from(parsed.root.getElementsByTagName('base')).map(m=>m.getAttribute('displaycolor'));assert.ok(materials.includes('#171717FF'));assert.ok(materials.includes('#FF0000FF'));const project=JSON.parse(strFromU8(parsed.archive['Metadata/project_settings.config']));assert.equal(project.flush_volumes_matrix.length,materials.length**2);assert.equal(project.flush_volumes_vector.length,materials.length*2);
 }
});
test('manufacturing exports require admin access before private files are read',async()=>{
 let admin=false,reads=0,calls=0;
 const route=load('../app/api/porte-boisson/demandes/[id]/export/route.ts',{'@/lib/auth':{isAdmin:async()=>admin},'@/lib/store':{getHolderRequest:async()=>{reads++;return {id:'aaaaaaaaaaaaaaa'};},getHolderLogo:async()=>Buffer.from('logo')},'@/lib/custom-holder-http':{checkHolderOrigin:()=>{}},'@/lib/holder-manufacturing-options.mjs':{manufacturingOptions},'@/lib/holder-manufacturing-server':{exportHolder3mf:async()=>{calls++;return exported;}}});
 const call=()=>route.POST(new Request('https://krearun.re/api/porte-boisson/demandes/x/export',{method:'POST',body:'{}'}),{params:Promise.resolve({id:'aaaaaaaaaaaaaaa'})});
 assert.equal((await call()).status,401);assert.equal(reads,0);assert.equal(calls,0);admin=true;const response=await call();assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'model/3mf');assert.match(response.headers.get('cache-control'),/no-store/);assert.equal(calls,1);
});
