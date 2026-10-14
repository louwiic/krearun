// Project the actual preview mesh into a static SVG for catalog cards. No WebGL
// context or 3D library has to load on the shop listing to display this image.
import {readFile,writeFile} from 'node:fs/promises';
import opentype from 'opentype.js';
import sharp from 'sharp';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const bytes=await readFile('public/models/holders/custom.glb');
const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const font=opentype.loadSync('public/fonts/DejaVuSansCondensed-Bold.ttf');
const lettering=new THREE.ShapePath();
for(const command of font.getPath('KREARUN',0,100,100).commands){
 if(command.type==='M')lettering.moveTo(command.x,command.y);
 else if(command.type==='L')lettering.lineTo(command.x,command.y);
 else if(command.type==='Q')lettering.quadraticCurveTo(command.x1,command.y1,command.x,command.y);
 else if(command.type==='C')lettering.bezierCurveTo(command.x1,command.y1,command.x2,command.y2,command.x,command.y);
 else if(command.type==='Z')lettering.currentPath.closePath();
}
const geometries=lettering.toShapes(true).map(shape=>new THREE.ExtrudeGeometry(shape,{depth:.8,bevelEnabled:false,curveSegments:8}));
const box=new THREE.Box3();for(const geometry of geometries){geometry.computeBoundingBox();box.union(geometry.boundingBox);}
const center=box.getCenter(new THREE.Vector3()),scale=50/(box.max.x-box.min.x);
for(const geometry of geometries){const vertices=geometry.getAttribute('position');for(let i=0;i<vertices.count;i++){const x=(vertices.getX(i)-center.x)*scale,y=-(vertices.getY(i)-center.y)*scale+5,radius=38.5+vertices.getZ(i),angle=x/38.5;vertices.setXYZ(i,Math.sin(angle)*radius,y,Math.cos(angle)*radius);}geometry.computeVertexNormals();scene.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0xffffff})));}
scene.updateMatrixWorld(true);
const camera=new THREE.PerspectiveCamera(34,1,.1,2000);camera.position.set(140,80,395);camera.lookAt(15,0,0);camera.updateMatrixWorld();camera.updateProjectionMatrix();
const light=new THREE.Vector3(-.6,.8,1).normalize(),fill=new THREE.Vector3(1,.25,-.4).normalize();
const size=1000,pixels=new Uint8Array(size*size*4),depths=new Float32Array(size*size).fill(Infinity);
scene.traverse(object=>{if(!(object instanceof THREE.Mesh))return;
 const geometry=object.geometry;if(!geometry.getAttribute('normal'))geometry.computeVertexNormals();const positions=geometry.getAttribute('position'),normals=geometry.getAttribute('normal'),index=geometry.index,normalMatrix=new THREE.Matrix3().getNormalMatrix(object.matrixWorld);
 const white=object.material.color?.getHex()===0xffffff,count=index?index.count:positions.count;
 for(let i=0;i<count;i+=3){
  const ids=[0,1,2].map(j=>index?index.getX(i+j):i+j);
  const world=ids.map(id=>new THREE.Vector3().fromBufferAttribute(positions,id).applyMatrix4(object.matrixWorld));
  const normal=new THREE.Vector3().subVectors(world[1],world[0]).cross(new THREE.Vector3().subVectors(world[2],world[0]));
  if(normal.dot(new THREE.Vector3().subVectors(camera.position,world[0]))<=0)continue;
  const p=world.map(v=>{const q=v.clone().project(camera);return {x:(q.x+1)*500,y:(1-q.y)*500,z:q.z};});
  const ns=ids.map(id=>new THREE.Vector3().fromBufferAttribute(normals,id).applyMatrix3(normalMatrix).normalize());
  const [a,b,c]=p,den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(den)<1e-9)continue;
  for(let y=Math.max(0,Math.floor(Math.min(...p.map(v=>v.y))));y<=Math.min(999,Math.ceil(Math.max(...p.map(v=>v.y))));y++)for(let x=Math.max(0,Math.floor(Math.min(...p.map(v=>v.x))));x<=Math.min(999,Math.ceil(Math.max(...p.map(v=>v.x))));x++){
   const u=((b.y-c.y)*(x+.5-c.x)+(c.x-b.x)*(y+.5-c.y))/den,v=((c.y-a.y)*(x+.5-c.x)+(a.x-c.x)*(y+.5-c.y))/den,w=1-u-v;if(u<0||v<0||w<0)continue;
   const z=u*a.z+v*b.z+w*c.z,offset=y*size+x;if(z>=depths[offset])continue;depths[offset]=z;
   const n=ns[0].clone().multiplyScalar(u).addScaledVector(ns[1],v).addScaledVector(ns[2],w).normalize();
   const shade=.42+.57*Math.max(0,n.dot(light))+.2*Math.max(0,n.dot(fill));
   const value=white?Math.min(255,Math.round(208*shade+40)):Math.min(72,Math.round(20+30*shade));
   pixels.set(white?[value,value,value-2,255]:[value-1,value,value,255],offset*4);
  }
 }
});
const rendered=await sharp(pixels,{raw:{width:size,height:size,channels:4}}).png().toBuffer();
const output=`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000" role="img" aria-label="Porte-boisson KREARUN 500 ml — modèle 3D réel" data-source-model="holders/custom.glb"><title>Porte-boisson 500 ml personnalisé KREARUN</title><rect width="1000" height="1000" fill="#eeeae0"/><circle cx="500" cy="475" r="355" fill="#e4dfd4"/><ellipse cx="510" cy="855" rx="220" ry="25" fill="#171713" opacity=".12"/><image width="1000" height="1000" href="data:image/png;base64,${rendered.toString('base64')}"/><text x="75" y="940" fill="#171713" font-family="Arial,sans-serif" font-size="38" font-weight="bold">CRÉEZ LE VÔTRE.</text></svg>`;
await writeFile('public/products/porte-boisson-personnalise.svg',output);console.log('Actual-model catalog SVG:',Buffer.byteLength(output),'bytes');
