"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Gallery from "./Gallery";
import { NOS_COLOR_EVENT } from "@/lib/nos-preview";
import type { ProductColor } from "@/lib/types";
const NosPreview3D=dynamic(()=>import("./NosPreview3D"),{ssr:false,loading:()=><p role="status" className="flex h-[390px] items-center justify-center rounded-2xl border-2 border-ink bg-cream text-sm sm:h-[520px]">Chargement de l’aperçu 3D…</p>});

export default function NosProductGallery({images,videoUrl,name,initialColor}:{images:string[];videoUrl:string;name:string;initialColor:ProductColor}) {
  const [selected,setSelected]=useState(initialColor);
  const [view,setView]=useState("photo");
  const [hasPreview,setHasPreview]=useState(false);
  useEffect(()=>{
    function select(event:Event) {
      const color=(event as CustomEvent<ProductColor>).detail;
      if(!color||!/^#[a-f0-9]{6}$/i.test(color.hex)||!color.name)return;
      setSelected(color);setHasPreview(true);setView("3d");
    }
    window.addEventListener(NOS_COLOR_EVENT,select);
    return()=>window.removeEventListener(NOS_COLOR_EVENT,select);
  },[]);
  return <div className="min-w-0 space-y-3">
    <div className="flex gap-2" role="group" aria-label="Vue du produit NOS">
      <button type="button" aria-pressed={view==="3d"} onClick={()=>{setHasPreview(true);setView("3d");}} className={`rounded-full border px-5 py-2 text-sm font-semibold ${view==="3d"?"border-ink bg-ink text-white":"border-sand"}`}>Aperçu 3D</button>
      <button type="button" aria-pressed={view==="photo"} onClick={()=>setView("photo")} className={`rounded-full border px-5 py-2 text-sm font-semibold ${view==="photo"?"border-ink bg-ink text-white":"border-sand"}`}>Photo réelle</button>
    </div>
    {hasPreview&&<div hidden={view!=="3d"}><NosPreview3D color={selected.hex} colorName={selected.name}/></div>}
    {view==="photo"&&<Gallery images={images} videoUrl={videoUrl} name={name} imageFit="contain"/>}
  </div>;
}
