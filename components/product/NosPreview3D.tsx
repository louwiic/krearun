"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { NOS_MODEL_URL, nosPartAppearance } from "@/lib/nos-preview";

export default function NosPreview3D({color,colorName}:{color:string;colorName:string}) {
  const host = useRef<HTMLDivElement>(null);
  const bodyMaterials = useRef<THREE.MeshStandardMaterial[]>([]);
  const currentColor = useRef(color);
  const renderView = useRef<()=>void>(()=>{});
  const reset = useRef<()=>void>(()=>{});
  const [status,setStatus] = useState("Chargement du modèle NOS…");

  useEffect(()=>{
    currentColor.current=color;
    bodyMaterials.current.forEach(material=>material.color.set(color));
    renderView.current();
  },[color]);

  useEffect(()=>{
    const element=host.current;
    if(!element)return;
    let disposed=false;
    let renderer:THREE.WebGLRenderer;
    try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true}); }
    catch { queueMicrotask(()=>setStatus("La 3D n’est pas disponible sur cet appareil. Vous pouvez consulter la photo."));return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.setClearColor(0xf5f3ed,1);
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.15;
    element.appendChild(renderer.domElement);
    const scene=new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff,0xb5ac9e,2.5));
    const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(-180,270,300);scene.add(key);
    const fill=new THREE.DirectionalLight(0xffffff,1.8);fill.position.set(180,80,-160);scene.add(fill);
    const camera=new THREE.PerspectiveCamera(34,1,.1,2000);
    const controls=new OrbitControls(camera,renderer.domElement);
    controls.enablePan=false;
    controls.minDistance=180;controls.maxDistance=850;
    const render=()=>{if(!disposed)renderer.render(scene,camera);};
    renderView.current=render;controls.addEventListener("change",render);
    let model:THREE.Group|undefined;
    let modelSize=new THREE.Vector3(78,251,78);
    function resize() {
      const rect=element!.getBoundingClientRect();if(!rect.width||!rect.height)return;
      renderer.setSize(rect.width,rect.height);
      camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();
      render();
    }
    function fit() {
      const fov=camera.fov*Math.PI/180;
      const distance=Math.max(modelSize.y/(2*Math.tan(fov/2)),modelSize.x/(2*Math.tan(fov/2)*camera.aspect))*1.2;
      camera.position.set(distance*.15,distance*.045,distance);
      controls.target.set(0,0,0);controls.update();controls.saveState();render();
    }
    reset.current=fit;
    const observer=new ResizeObserver(resize);observer.observe(element);resize();
    function disposeModel(root:THREE.Group) {
      root.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();(Array.isArray(object.material)?object.material:[object.material]).forEach(material=>material.dispose());}});
    }
    void new GLTFLoader().loadAsync(NOS_MODEL_URL).then(gltf=>{
      if(disposed){disposeModel(gltf.scene);return;}
      model=gltf.scene;
      model.traverse(object=>{
        if(!(object instanceof THREE.Mesh))return;
        const original=Array.isArray(object.material)?object.material:[object.material];
        original.forEach(material=>material.dispose());
        const material=new THREE.MeshStandardMaterial(nosPartAppearance(object.name,currentColor.current));
        object.material=material;
        if(/^0[12]_/.test(object.name))bodyMaterials.current.push(material);
        if(!object.geometry.getAttribute("normal"))object.geometry.computeVertexNormals();
      });
      // The source assembly uses millimetres with Z up, and its label faces -Y.
      model.rotation.x=-Math.PI/2;
      const box=new THREE.Box3().setFromObject(model);
      modelSize=box.getSize(new THREE.Vector3());
      model.position.sub(box.getCenter(new THREE.Vector3()));
      scene.add(model);fit();setStatus("");
    }).catch(()=>{if(!disposed)setStatus("Le modèle 3D n’a pas pu être chargé. Consultez la photo ou rechargez la page.");});
    return()=>{
      disposed=true;observer.disconnect();controls.dispose();
      if(model)disposeModel(model);
      bodyMaterials.current=[];renderView.current=()=>{};reset.current=()=>{};
      renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();
    };
  },[]);

  return <div className="overflow-hidden rounded-2xl border-2 border-ink bg-cream">
    <div className="relative">
      <div ref={host} role="img" aria-label={`Aperçu 3D du porte-boisson NOS 500 ml — ${colorName}`} data-nos-preview-color={color} className="h-[390px] w-full touch-none sm:h-[520px]" />
      <span className="pointer-events-none absolute left-4 top-4 text-xs font-bold uppercase tracking-wide">Aperçu 3D · {colorName}</span>
      <button type="button" onClick={()=>reset.current()} aria-label="Réinitialiser la vue du NOS" className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-2">↺</button>
      {status&&<p role="status" className="absolute inset-0 flex items-center justify-center bg-cream/95 p-6 text-center text-sm">{status}</p>}
    </div>
    <p className="border-t border-ink/15 px-4 py-3 text-xs text-ink-soft">Faites glisser pour tourner, pincez pour zoomer. Aperçu des couleurs indicatif selon votre écran.</p>
  </div>;
}
