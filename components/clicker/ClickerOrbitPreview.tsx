"use client";
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import sourceManifest from '@/public/models/clicker/manifest.json';
type Asset={file:string};
const manifest=sourceManifest as {pitchMm:number;capBottomMm:number;bases:Record<string,Asset>;caps:Record<string,Asset>};
const icons:Record<string,string>={'★':'star','♥':'heart','☁':'cloud','♣':'clover'};
const templates=new Map<string,Promise<THREE.Group>>();
function loadPart(file:string){if(!templates.has(file))templates.set(file,new GLTFLoader().loadAsync(`/models/clicker/${file}`).then(gltf=>gltf.scene).catch(error=>{templates.delete(file);throw error;}));return templates.get(file)!;}

export default function ClickerOrbitPreview({text,symbol,baseColor,capColor,letterColor}:{text:string;symbol:string;baseColor:string;capColor:string;letterColor:string}) {
  const host=useRef<HTMLDivElement>(null),reset=useRef<()=>void>(()=>{});
  const [error,setError]=useState(''),[loading,setLoading]=useState(true);
  useEffect(()=>{
    const element=host.current;if(!element)return;let renderer:THREE.WebGLRenderer;let disposed=false;
    try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});}catch{queueMicrotask(()=>{setLoading(false);setError('L’aperçu 3D est indisponible sur cet appareil. L’aperçu du dessus reste visible.');});return;}
    queueMicrotask(()=>{setError('');setLoading(true);});renderer.setClearColor(0xfff3f5,1);renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label',`Clicker ${text} ${symbol} en 3D, modèle issu des fichiers 3MF, orientable au toucher`);element.appendChild(renderer.domElement);
    const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xffffff,0x8c7b78,2.5));
    const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-80,150,100);scene.add(light);const fill=new THREE.DirectionalLight(0xffffff,1.5);fill.position.set(100,60,-50);scene.add(fill);
    const model=new THREE.Group();scene.add(model);
    const tiles=[...Array.from(text),...Array.from(symbol)],count=Math.max(1,tiles.length),pitch=manifest.pitchMm,width=count*pitch+5.38;
    const textures:THREE.Texture[]=[];
    const camera=new THREE.PerspectiveCamera(35,1,.1,4000);const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,11,0);controls.enablePan=false;controls.maxPolarAngle=Math.PI*.92;controls.enableDamping=false;
    const render=()=>{if(!disposed)renderer.render(scene,camera);};controls.addEventListener('change',render);
    function fit(){const rect=element!.getBoundingClientRect();if(!rect.width||!rect.height)return;renderer.setSize(rect.width,rect.height);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();const distance=Math.max(72,(width+12)/(2*Math.tan(camera.fov*Math.PI/360)*camera.aspect)*1.05);camera.position.copy(new THREE.Vector3(.25,.78,.7).normalize().multiplyScalar(distance)).add(controls.target);controls.minDistance=30;controls.maxDistance=Math.max(550,distance*2.5);controls.update();controls.saveState();render();}
    const observer=new ResizeObserver(fit);observer.observe(element);fit();reset.current=()=>controls.reset();
    function clonePart(template:THREE.Group){const copy=template.clone(true);copy.traverse(object=>{if(!(object instanceof THREE.Mesh))return;object.geometry=object.geometry.clone();if(!object.geometry.getAttribute('normal'))object.geometry.computeVertexNormals();const cloneMaterial=(original:THREE.Material)=>{const material=original.clone() as THREE.MeshStandardMaterial;material.color.set(object.name.startsWith('base_')?baseColor:object.name.startsWith('glyph_')?letterColor:capColor);material.roughness=.6;material.metalness=0;return material;};object.material=Array.isArray(object.material)?object.material.map(cloneMaterial):cloneMaterial(object.material);});return copy;}
    async function assemble(){
      const base=manifest.bases[String(count)];if(!base)throw new Error('Unsupported count');
      const selected=tiles.map(tile=>{const key=icons[tile]??tile;return {tile,asset:manifest.caps[key]??manifest.caps.blank,native:!!manifest.caps[key]};});
      const [baseTemplate,...caps]=await Promise.all([loadPart(base.file),...selected.map(({asset})=>loadPart(asset.file))]);if(disposed)return;
      model.add(clonePart(baseTemplate));
      selected.forEach(({tile,native},index)=>{
        const cap=clonePart(caps[index]);cap.position.set((index-(count-1)/2)*pitch,manifest.capBottomMm,0);model.add(cap);
        // The source pack has A–Z, digits and four of the offered icons. Other
        // characters keep the real blank keycap and receive a surface label.
        if(!native&&tile.trim()){
          const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const context=canvas.getContext('2d');if(context){context.fillStyle=letterColor;context.font='800 340px Arial, sans-serif';context.textAlign='center';context.textBaseline='middle';context.fillText(tile,256,277,440);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textures.push(texture);const label=new THREE.Mesh(new THREE.PlaneGeometry(13.8,13.8),new THREE.MeshStandardMaterial({map:texture,transparent:true,alphaTest:.05,roughness:.65,polygonOffset:true,polygonOffsetFactor:-1}));label.rotation.x=-Math.PI/2;label.position.set(cap.position.x,manifest.capBottomMm+5.01,0);model.add(label);}
        }
      });setLoading(false);render();
    }
    void assemble().catch(()=>{if(!disposed){setLoading(false);setError('Le modèle 3D n’a pas pu être chargé. Actualise la page pour réessayer.');}});
    return()=>{disposed=true;observer.disconnect();controls.dispose();const materials=new Set<THREE.Material>();model.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.dispose();(Array.isArray(object.material)?object.material:[object.material]).forEach(material=>materials.add(material));}});materials.forEach(material=>material.dispose());textures.forEach(texture=>texture.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
  },[text,symbol,baseColor,capColor,letterColor]);
  return <div className="relative"><div ref={host} className="h-[280px] w-full touch-none"/><button type="button" aria-label="Réinitialiser la vue du clicker" onClick={()=>reset.current()} className="absolute right-1 top-1 rounded-full bg-white/90 px-3 py-2 text-lg">↺</button>{(error||loading)&&<p role="status" className="absolute inset-0 flex items-center justify-center bg-[#fff3f5] p-4 text-center text-xs">{error||'Chargement du modèle 3D…'}</p>}<p className="mt-2 text-xs leading-5 text-ink-soft">Fais glisser pour tourner, pince pour zoomer. Aperçu du modèle et de ses couleurs. Le placement du symbole demandé en note sera vérifié à l’atelier.</p></div>;
}
