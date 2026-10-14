"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import opentype from "opentype.js";
import {holderTextContours} from "@/lib/holder-text.mjs";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { HOLDER_PRESET_PALETTES, holderModel, type HolderConfiguration, type HolderModel } from "@/lib/custom-holder";

const templates=new Map<HolderModel,Promise<THREE.Group>>();
function loadModel(model:HolderModel) {
  if(!templates.has(model))templates.set(model,new GLTFLoader().loadAsync(`/models/holders/${model}.glb`).then(gltf=>gltf.scene).catch(error=>{templates.delete(model);throw error;}));
  return templates.get(model)!;
}
let fontPromise:Promise<opentype.Font>|undefined;
function loadTextFont(){return fontPromise??=fetch('/fonts/DejaVuSansCondensed-Bold.ttf').then(response=>{if(!response.ok)throw new Error('Font unavailable');return response.arrayBuffer();}).then(buffer=>opentype.parse(buffer)).catch(error=>{fontPromise=undefined;throw error;});}
let lettering:ReturnType<SVGLoader['parse']>|undefined;
async function brandLettering() {
  if(!lettering){const response=await fetch('/models/holders/krearun.svg');if(!response.ok)throw new Error('Lettering unavailable');lettering=new SVGLoader().parse(await response.text());}
  return lettering;
}

export default function HolderPreview3D({configuration,logo,thumbnail=false}:{configuration:HolderConfiguration;logo?:string;thumbnail?:boolean}) {
  const host=useRef<HTMLDivElement>(null);
  const reset=useRef<()=>void>(()=>{});
  const [error,setError]=useState('');const [loading,setLoading]=useState(true);
  const selectedModel=holderModel(configuration);
  const logoFaces=configuration.logoFaces??1;
  const logoColorKey=configuration.logoColors?.join(',')??'';
  useEffect(()=>{
    const element=host.current;if(!element)return;
    let disposed=false;let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{queueMicrotask(()=>{setLoading(false);setError("L’aperçu 3D n’est pas disponible sur cet appareil.");});return;}
    queueMicrotask(()=>{setError('');setLoading(true);});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,thumbnail?1.5:2));renderer.setClearColor(0xeeeae0,1);
    renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label',`Modèle ${selectedModel==='custom'?'KREARUN':selectedModel.toUpperCase()} 500 ml en 3D`);
    element.appendChild(renderer.domElement);
    const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xffffff,0x898983,2.6));
    const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(-140,230,250);scene.add(key);
    const fill=new THREE.DirectionalLight(0xffffff,1.8);fill.position.set(150,90,-150);scene.add(fill);
    const model=new THREE.Group();scene.add(model);
    const camera=new THREE.PerspectiveCamera(thumbnail?35:34,1,.1,2000);camera.position.set(120,68,350);
    const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(15,0,0);controls.enablePan=false;controls.minDistance=230;controls.maxDistance=650;controls.enabled=!thumbnail;controls.update();controls.saveState();reset.current=()=>controls.reset();
    const render=()=>{if(!disposed)renderer.render(scene,camera);};controls.addEventListener('change',render);
    const resize=()=>{const {width,height}=element.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();render();};
    const observer=new ResizeObserver(resize);observer.observe(element);resize();
    const textures:THREE.Texture[]=[];
    async function decorate() {
      const source=await loadModel(selectedModel);if(disposed)return;
      const copy=source.clone(true);
      copy.traverse(object=>{
        if(!(object instanceof THREE.Mesh))return;
        object.geometry=object.geometry.clone();
        const cloneMaterial=(original:THREE.Material)=>{
          const material=original.clone() as THREE.MeshStandardMaterial;
          if(!object.name.startsWith('logo_'))material.color.set(object.name.startsWith('top_')?(configuration.topColor??configuration.bodyColor):object.name.startsWith('bottom_')?(configuration.bottomColor??configuration.bodyColor):configuration.bodyColor);
          else if(selectedModel!=='custom'&&logoColorKey){
            const palette=HOLDER_PRESET_PALETTES[selectedModel];const rgb=material.color.clone().convertLinearToSRGB();
            const distances=palette.map(hex=>{const reference=new THREE.Color(hex).convertLinearToSRGB();return (reference.r-rgb.r)**2+(reference.g-rgb.g)**2+(reference.b-rgb.b)**2;});
            const index=distances.indexOf(Math.min(...distances));const selected=logoColorKey.split(',')[index];if(selected)material.color.set(selected);
          }
          material.roughness=.65;material.metalness=0;return material;
        };
        object.material=Array.isArray(object.material)?object.material.map(cloneMaterial):cloneMaterial(object.material);
      });model.add(copy);render();
      let logoHeight=8;
      if(selectedModel==='custom'){
        if(logo){
          const texture=await new THREE.TextureLoader().loadAsync(logo);if(disposed){texture.dispose();return;}
          textures.push(texture);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
          const image=texture.image as HTMLImageElement;const ratio=image.width/image.height;
          const width=configuration.logoWidth,height=Math.min(88,width/ratio),segments=80,radius=38.65;logoHeight=height;
          const positions:number[]=[],uv:number[]=[],indices:number[]=[];
          for(let y=0;y<=1;y++)for(let x=0;x<=segments;x++){
            const u=x/segments,theta=(u-.5)*width/radius;positions.push(Math.sin(theta)*radius,(y-.5)*height+configuration.logoOffset+5,Math.cos(theta)*radius);uv.push(u,y);
          }
          for(let x=0;x<segments;x++){const top=segments+1+x;indices.push(x,x+1,top,top,x+1,top+1);}
          const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
          const material=new THREE.MeshStandardMaterial({map:texture,transparent:true,alphaTest:.5,roughness:.65,side:THREE.FrontSide});
          for(let face=0;face<logoFaces;face++){const mesh=new THREE.Mesh(face?geometry.clone():geometry,material);mesh.rotation.y=face*Math.PI;model.add(mesh);}
        }else{
          const svg=await brandLettering();if(disposed)return;
          const geometries=svg.paths.flatMap(path=>SVGLoader.createShapes(path)).map(shape=>new THREE.ExtrudeGeometry(shape,{depth:.8,bevelEnabled:false,steps:1,curveSegments:8}));
          const bounds=new THREE.Box3();for(const geometry of geometries){geometry.computeBoundingBox();bounds.union(geometry.boundingBox!);}
          const center=bounds.getCenter(new THREE.Vector3()),scale=50/(bounds.max.x-bounds.min.x);
          const bodyColor=new THREE.Color(configuration.bodyColor);const lightness=.2126*bodyColor.r+.7152*bodyColor.g+.0722*bodyColor.b;
          const material=new THREE.MeshStandardMaterial({color:lightness>.45?0x191815:0xffffff,roughness:.6});
          for(const geometry of geometries){const vertices=geometry.getAttribute('position');for(let i=0;i<vertices.count;i++){const x=(vertices.getX(i)-center.x)*scale,y=-(vertices.getY(i)-center.y)*scale+5,radius=38.5+vertices.getZ(i);const theta=x/38.5;vertices.setXYZ(i,Math.sin(theta)*radius,y,Math.cos(theta)*radius);}geometry.computeVertexNormals();for(let face=0;face<logoFaces;face++){const mesh=new THREE.Mesh(face?geometry.clone():geometry,material);mesh.rotation.y=face*Math.PI;model.add(mesh);}}
        }
      }
      if(configuration.verticalName||configuration.engravingText){
        const font=await loadTextFont();if(disposed)return;
        for(const text of holderTextContours(font,{model:selectedModel,logoFaces:configuration.logoFaces,logoOffset:configuration.logoOffset,verticalName:configuration.verticalName,engravingText:configuration.engravingText},logoHeight)){
          const paths=new THREE.ShapePath();for(const polygon of text.polygons){if(!polygon.length)continue;paths.moveTo(polygon[0][0],polygon[0][1]);for(const [x,y] of polygon.slice(1))paths.lineTo(x,y);paths.currentPath?.closePath();}
          for(const shape of paths.toShapes()){
            const geometry=new THREE.ShapeGeometry(shape);const vertices=geometry.getAttribute('position');for(let i=0;i<vertices.count;i++){const angle=vertices.getX(i)/38.38+text.angle;vertices.setXYZ(i,Math.sin(angle)*38.65,vertices.getY(i)+5,Math.cos(angle)*38.65);}geometry.computeVertexNormals();
            // Dark recess shading on the body; the exported mesh contains the real cut.
            model.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:new THREE.Color(configuration.bodyColor).getHSL({h:0,s:0,l:0}).l<.25?0x77716b:0x302d29,roughness:1,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1})));
          }
        }
      }
      render();if(!disposed)setLoading(false);
    }
    void decorate().catch(()=>{if(!disposed){setLoading(false);setError("Le modèle 3D n’a pas pu être chargé. Actualisez la page pour réessayer.");}});
    return()=>{disposed=true;observer.disconnect();controls.dispose();const materials=new Set<THREE.Material>();model.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();(Array.isArray(object.material)?object.material:[object.material]).forEach(material=>materials.add(material));}});materials.forEach(material=>material.dispose());textures.forEach(texture=>texture.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
  },[configuration.bodyColor,configuration.logoWidth,configuration.logoOffset,selectedModel,logo,thumbnail,logoColorKey,logoFaces,configuration.topColor,configuration.bottomColor,configuration.verticalName,configuration.engravingText]);
  return <div className={`relative overflow-hidden bg-cream ${thumbnail?'pointer-events-none rounded-lg':'rounded-2xl border-2 border-ink'}`}>
    <div ref={host} className={thumbnail?'h-[130px] w-full':'h-[360px] w-full touch-none sm:h-[440px]'}/>
    {!thumbnail&&<><span className="pointer-events-none absolute left-4 top-3 text-xs font-bold uppercase tracking-wide">Aperçu 3D • 500 ml</span><button type="button" onClick={()=>reset.current()} aria-label="Réinitialiser la vue 3D" className="absolute right-3 top-2 rounded-full bg-white/90 px-3 py-2 text-lg">↺</button></>}
    {(error||loading)&&<p role="status" className="absolute inset-0 flex items-center justify-center bg-cream/95 p-3 text-center text-xs">{error||'Chargement 3D…'}</p>}
    {!thumbnail&&<p className="border-t border-ink/15 px-4 py-3 text-xs text-ink-soft">Faites glisser pour tourner le porte-boisson. Aperçu indicatif, fabrication soumise à validation.</p>}
  </div>;
}
