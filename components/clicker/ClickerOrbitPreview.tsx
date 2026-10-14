"use client";
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

export default function ClickerOrbitPreview({text,symbol,baseColor,capColor,letterColor}:{text:string;symbol:string;baseColor:string;capColor:string;letterColor:string}) {
  const host=useRef<HTMLDivElement>(null),reset=useRef<()=>void>(()=>{});
  const [error,setError]=useState('');
  useEffect(()=>{
    const element=host.current;if(!element)return;let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});}catch{queueMicrotask(()=>setError('L’aperçu 3D est indisponible sur cet appareil. L’aperçu du dessus reste visible.'));return;}
    queueMicrotask(()=>setError(''));renderer.setClearColor(0xfff3f5,1);renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label',`Clicker ${text} ${symbol} en 3D, orientable au toucher`);element.appendChild(renderer.domElement);
    const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xffffff,0x8c7b78,2.5));
    const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-80,150,100);scene.add(light);const fill=new THREE.DirectionalLight(0xffffff,1.5);fill.position.set(100,60,-50);scene.add(fill);
    const model=new THREE.Group();scene.add(model);
    const baseMaterial=new THREE.MeshStandardMaterial({color:baseColor,roughness:.65}),capMaterial=new THREE.MeshStandardMaterial({color:capColor,roughness:.55}),switchMaterial=new THREE.MeshStandardMaterial({color:0x333333,roughness:.8}),metalMaterial=new THREE.MeshStandardMaterial({color:0xb6b9bd,roughness:.3,metalness:.8});
    const tiles=[...Array.from(text),...Array.from(symbol)];const count=Math.max(1,tiles.length),pitch=22,width=count*pitch+6;
    const base=new THREE.Mesh(new RoundedBoxGeometry(width,8,26,3,3),baseMaterial);model.add(base);
    const textures:THREE.Texture[]=[];
    tiles.forEach((tile,index)=>{
      const x=(index-(count-1)/2)*pitch;
      const mount=new THREE.Mesh(new RoundedBoxGeometry(17,1.5,17,2,1),switchMaterial);mount.position.set(x,4.5,0);model.add(mount);
      const stem=new THREE.Mesh(new THREE.BoxGeometry(5,4,5),switchMaterial);stem.position.set(x,6,0);model.add(stem);
      const cap=new THREE.Mesh(new RoundedBoxGeometry(18.5,5.5,18.5,3,2),capMaterial);cap.position.set(x,10,0);model.add(cap);
      if(tile.trim()){
        const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const context=canvas.getContext('2d');if(context){context.fillStyle=letterColor;context.font='800 340px Arial, sans-serif';context.textAlign='center';context.textBaseline='middle';context.fillText(tile,256,277,440);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textures.push(texture);const label=new THREE.Mesh(new THREE.PlaneGeometry(13.8,13.8),new THREE.MeshStandardMaterial({map:texture,transparent:true,alphaTest:.05,roughness:.65,polygonOffset:true,polygonOffsetFactor:-1}));label.rotation.x=-Math.PI/2;label.position.set(x,12.77,0);model.add(label);}
      }
    });
    const ring=new THREE.Mesh(new THREE.TorusGeometry(4, .8,12,40),metalMaterial);ring.rotation.x=Math.PI/2;ring.position.set(-width/2-3,0,0);model.add(ring);
    const camera=new THREE.PerspectiveCamera(35,1,.1,4000);const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(-2,3,0);controls.enablePan=false;controls.maxPolarAngle=Math.PI*.92;controls.enableDamping=false;
    const render=()=>renderer.render(scene,camera);controls.addEventListener('change',render);
    function fit(){const rect=element!.getBoundingClientRect();if(!rect.width||!rect.height)return;renderer.setSize(rect.width,rect.height);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();const verticalFov=camera.fov*Math.PI/180;const distance=Math.max(65,(width+12)/(2*Math.tan(verticalFov/2)*camera.aspect)*1.05);camera.position.copy(new THREE.Vector3(.25,.78,.7).normalize().multiplyScalar(distance));controls.minDistance=30;controls.maxDistance=Math.max(550,distance*2.5);controls.update();controls.saveState();render();}
    const observer=new ResizeObserver(fit);observer.observe(element);fit();reset.current=()=>controls.reset();
    return()=>{observer.disconnect();controls.dispose();const materials=new Set<THREE.Material>();model.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();(Array.isArray(object.material)?object.material:[object.material]).forEach(material=>materials.add(material));}});materials.forEach(material=>material.dispose());textures.forEach(texture=>texture.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
  },[text,symbol,baseColor,capColor,letterColor]);
  return <div className="relative"><div ref={host} className="h-[280px] w-full touch-none"/><button type="button" aria-label="Réinitialiser la vue du clicker" onClick={()=>reset.current()} className="absolute right-1 top-1 rounded-full bg-white/90 px-3 py-2 text-lg">↺</button>{error&&<p role="status" className="absolute inset-0 flex items-center justify-center bg-blush/10 p-4 text-center text-xs">{error}</p>}<p className="mt-2 text-xs leading-5 text-ink-soft">Fais glisser pour tourner, pince pour zoomer. Aperçu indicatif du clicker et de ses couleurs. Le placement du symbole demandé en note sera vérifié à l’atelier.</p></div>;
}
