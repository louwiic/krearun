"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { HolderConfiguration } from "@/lib/custom-holder";

export default function HolderPreview3D({configuration,logo}:{configuration:HolderConfiguration;logo?:string}) {
  const host=useRef<HTMLDivElement>(null);
  const reset=useRef<()=>void>(()=>{});
  const [error,setError]=useState('');
  useEffect(()=>{
    const element=host.current;if(!element)return;
    let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{queueMicrotask(()=>setError("L’aperçu 3D n’est pas disponible sur cet appareil. Votre logo et votre demande restent accessibles."));return;}
    queueMicrotask(()=>setError(''));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.setClearColor(0xeeeae0,1);
    renderer.domElement.setAttribute('role','img');
    renderer.domElement.setAttribute('aria-label','Porte-boisson 500 ml personnalisé en 3D, orientable au toucher');
    element.appendChild(renderer.domElement);
    const scene=new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff,0x9c9c94,3));
    const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(-140,230,250);scene.add(key);
    const fill=new THREE.DirectionalLight(0xffffff,1.5);fill.position.set(150,90,-150);scene.add(fill);
    const model=new THREE.Group();scene.add(model);
    const bodyMaterial=new THREE.MeshStandardMaterial({color:configuration.bodyColor,roughness:.62});
    const metal=new THREE.MeshStandardMaterial({color:0xc8cbd0,metalness:.7,roughness:.28});
    const materials:THREE.Material[]=[bodyMaterial,metal];
    const profile=[new THREE.Vector2(0,-75),new THREE.Vector2(36,-75),new THREE.Vector2(36,70),new THREE.Vector2(33.5,70),new THREE.Vector2(33.5,-72),new THREE.Vector2(0,-72)];
    const body=new THREE.Mesh(new THREE.LatheGeometry(profile,96),bodyMaterial);model.add(body);
    // A neutral 500 ml can gives scale without adding a third-party brand.
    const can=new THREE.Mesh(new THREE.CylinderGeometry(32.7,32.7,167,64),metal);can.position.y=9;model.add(can);
    const lid=new THREE.Mesh(new THREE.CylinderGeometry(31.8,31.8,1.2,64),metal);lid.position.y=93;model.add(lid);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(31.7,1,10,64),metal);rim.rotation.x=Math.PI/2;rim.position.y=94;model.add(rim);
    const tab=new THREE.Mesh(new THREE.TorusGeometry(6,1.4,8,24),metal);tab.rotation.x=Math.PI/2;tab.scale.y=1.5;tab.position.set(0,95,2);model.add(tab);
    const shape=new THREE.Shape();
    shape.moveTo(33,43);shape.lineTo(64,43);shape.quadraticCurveTo(77,43,77,30);shape.lineTo(77,-38);shape.quadraticCurveTo(77,-51,64,-51);shape.lineTo(33,-51);shape.lineTo(33,-41);shape.lineTo(63,-41);shape.quadraticCurveTo(67,-41,67,-36);shape.lineTo(67,28);shape.quadraticCurveTo(67,33,62,33);shape.lineTo(33,33);shape.closePath();
    const handle=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:9,bevelEnabled:true,bevelSize:1.1,bevelThickness:1,bevelSegments:3,steps:1}),bodyMaterial);
    handle.position.z=-4.5;model.add(handle);
    const camera=new THREE.PerspectiveCamera(34,1,.1,2000);
    camera.position.set(165,105,300);
    const controls=new OrbitControls(camera,renderer.domElement);
    controls.target.set(10,8,0);controls.enablePan=false;controls.minDistance=200;controls.maxDistance=560;controls.enableDamping=false;controls.update();controls.saveState();
    reset.current=()=>controls.reset();
    const render=()=>renderer.render(scene,camera);
    controls.addEventListener('change',render);
    const observer=new ResizeObserver(()=>{
      const {width,height}=element.getBoundingClientRect();if(!width||!height)return;
      renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();render();
    });observer.observe(element);
    let disposed=false;let texture:THREE.Texture|undefined;
    if(logo)new THREE.TextureLoader().load(logo,t=>{
      if(disposed){t.dispose();return;}
      texture=t;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
      const ratio=(t.image as HTMLImageElement).width/(t.image as HTMLImageElement).height;
      const width=configuration.logoWidth,height=Math.min(88,width/ratio),segments=64,radius=36.35;
      const positions:number[]=[],uv:number[]=[],indices:number[]=[];
      for(let y=0;y<=1;y++)for(let x=0;x<=segments;x++){
        const u=x/segments,theta=(u-.5)*width/radius;
        positions.push(Math.sin(theta)*radius,(y-.5)*height+configuration.logoOffset,Math.cos(theta)*radius);
        uv.push(u,y);
      }
      for(let x=0;x<segments;x++){const top=segments+1+x;indices.push(x,x+1,top,top,x+1,top+1);}
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
      const material=new THREE.MeshStandardMaterial({map:t,transparent:true,alphaTest:.5,roughness:.65,side:THREE.DoubleSide});materials.push(material);
      model.add(new THREE.Mesh(geometry,material));render();
    },undefined,()=>{if(!disposed)setError("Le logo n’a pas pu être affiché en 3D. Réessayez avec votre fichier.");});
    render();
    return()=>{disposed=true;observer.disconnect();controls.dispose();model.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});materials.forEach(m=>m.dispose());texture?.dispose();renderer.dispose();renderer.domElement.remove();};
  },[configuration.bodyColor,configuration.logoWidth,configuration.logoOffset,logo]);
  return <div className="relative overflow-hidden rounded-2xl border-2 border-ink bg-cream">
    <div ref={host} className="h-[360px] w-full touch-none sm:h-[440px]" />
    <span className="pointer-events-none absolute left-4 top-3 text-xs font-bold uppercase tracking-wide">Aperçu 3D • 500 ml</span>
    <button type="button" onClick={()=>reset.current()} aria-label="Réinitialiser la vue 3D" className="absolute right-3 top-2 rounded-full bg-white/90 px-3 py-2 text-lg">↺</button>
    {error&&<p role="status" className="absolute inset-0 flex items-center justify-center bg-cream/95 p-6 text-center text-sm">{error}</p>}
    <p className="border-t border-ink/15 px-4 py-3 text-xs text-ink-soft">Faites glisser pour tourner le porte-boisson. Aperçu indicatif, fabrication soumise à validation.</p>
  </div>;
}
