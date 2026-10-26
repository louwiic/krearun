import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {nosPartAppearance} from '../lib/nos-preview.ts';

const bytes=readFileSync(new URL('../public/models/nos/nos-500ml.glb',import.meta.url));
const model=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
test('the actual NOS assembly keeps its label and gold parts when the shell color changes',()=>{
 assert.equal(bytes.toString('utf8',0,4),'glTF');
 assert.equal(model.nodes.length,11);
 for(const color of ['#171717','#e66a9c','#ffffff']) {
  for(const node of model.nodes) {
   const material=nosPartAppearance(node.name,color);
   if(/^0[12]_/.test(node.name))assert.equal(material.color,color);
   else assert.deepEqual(material,nosPartAppearance(node.name,'#243ecb'));
  }
 }
 assert.equal(nosPartAppearance('03_VANNE_DOREE','#000000').color,'#b89547');
 assert.equal(nosPartAppearance('09_LOGO_NOS_BLANC','#000000').color,'#ffffff');
 assert.equal(nosPartAppearance('11_TRIANGLE_JAUNE','#000000').color,'#e9d927');
});
test('the complete source mesh is embedded locally with no external resources',()=>{
 assert.ok(model.buffers.every(buffer=>!buffer.uri));
 assert.ok(!model.images?.length);
 const parts=model.nodes.map(node=>node.name);
 for(const name of ['01_BASE_BLEUE','02_COQUE_HAUTE_BLEUE','04_MOLETTE_DOREE','12_CRANE_NOIR'])assert.ok(parts.includes(name));
 const positions=model.meshes.flatMap(mesh=>mesh.primitives.map(primitive=>model.accessors[primitive.attributes.POSITION]));
 assert.ok(Math.max(...positions.map(p=>p.max[2]))>250);
 assert.equal(Math.min(...positions.map(p=>p.min[2])),0);
});

test('the NOS gallery initially shows the real photo and defers the 3D viewer',async()=>{
 const ts=(await import('typescript')).default;
 const {createRequire}=await import('node:module');const require=createRequire(import.meta.url);
 const {createElement}=await import('react');const {renderToStaticMarkup}=await import('react-dom/server');
 let previews=0;
 function load(path,mocks={}){
  const {outputText}=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}});
  const mod={exports:{}};new Function('require','module','exports',outputText)(name=>mocks[name]??require(name),mod,mod.exports);return mod.exports.default;
 }
 const Gallery=load('../components/product/Gallery.tsx');
 const NosGallery=load('../components/product/NosProductGallery.tsx',{
  './Gallery':Gallery,'@/lib/nos-preview':{NOS_COLOR_EVENT:'krearun:nos-color'},
  'next/dynamic':()=>()=>{previews++;return createElement('div',null,'3D initialized');},
 });
 const html=renderToStaticMarkup(createElement(NosGallery,{images:['/real-nos-photo.webp'],videoUrl:'',name:'NOS',initialColor:{name:'Noir',hex:'#171717'}}));
 assert.match(html,/src="\/real-nos-photo.webp"/);assert.match(html,/object-contain/);
 assert.equal(previews,0);assert.ok(!html.includes('3D initialized'));
});
