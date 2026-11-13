"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Gallery from "./Gallery";
import { MONSTER_COLOR_EVENT, monsterRealPhoto } from "@/lib/monster-preview";
import type { Product, ProductColor } from "@/lib/types";
import MonsterGiftPreview from "./MonsterGiftPreview";
import { useColorAvailability, useProductColors } from "./ColorAvailabilityProvider";
import { colorSwatchStyle } from "@/lib/color-swatches";
import { publicColorName } from "@/lib/colors";
const MonsterPreview3D=dynamic(()=>import("./MonsterPreview3D"),{ssr:false,loading:()=><p role="status" className="flex h-[390px] items-center justify-center rounded-2xl border-2 border-ink bg-cream text-sm sm:h-[520px]">Chargement de l’aperçu 3D…</p>});

export default function MonsterProductGallery({product,images,videoUrl,name,initialColor}:{product:Product;images:string[];videoUrl:string;name:string;initialColor:ProductColor}) {
  const isAvailable=useColorAvailability();
  const {colors}=useProductColors(product);
  const [selected,setSelected]=useState(initialColor);
  const photo=monsterRealPhoto(selected.name);
  function choose(color:ProductColor) {
    window.dispatchEvent(new CustomEvent(MONSTER_COLOR_EVENT,{detail:{name:publicColorName(color.name),hex:color.hex}}));
  }
  const [view,setView]=useState("3d");
  const [hasPreview,setHasPreview]=useState(true);
  useEffect(()=>{
    function select(event:Event) {
      const color=(event as CustomEvent<ProductColor>).detail;
      if(!color||!/^#[a-f0-9]{6}$/i.test(color.hex)||!color.name)return;
      setSelected(color);setHasPreview(true);setView("3d");
    }
    window.addEventListener(MONSTER_COLOR_EVENT,select);
    return()=>window.removeEventListener(MONSTER_COLOR_EVENT,select);
  },[]);
  return <div className="min-w-0 space-y-3">
    <div className="flex gap-2" role="group" aria-label="Vue du porte-canette Monster">
      <button type="button" aria-pressed={view==="3d"} onClick={()=>{setHasPreview(true);setView("3d");}} className={`rounded-full border px-5 py-2 text-sm font-semibold ${view==="3d"?"border-ink bg-ink text-white":"border-sand"}`}>Aperçu 3D</button>
      <button type="button" aria-pressed={view==="photo"} onClick={()=>setView("photo")} className={`rounded-full border px-5 py-2 text-sm font-semibold ${view==="photo"?"border-ink bg-ink text-white":"border-sand"}`}>Photo réelle</button>
    </div>
    {hasPreview&&<div hidden={view!=="3d"} className="relative">
      <MonsterPreview3D color={selected.hex} colorName={selected.name}/>
      <div className="pointer-events-none absolute right-3 top-16 flex flex-col items-center rounded-xl bg-white/90 p-2 shadow-soft">
        <MonsterGiftPreview color={selected.hex} colorName={selected.name}/>
        <span className="text-[10px] font-bold">Porte-clés offert</span>
      </div>
      {photo && <a href={photo} target="_blank" rel="noreferrer" aria-label={`Agrandir la photo réelle — ${selected.name}`} className="absolute bottom-24 right-3 w-24 rounded-xl border border-sand bg-white/90 p-2 shadow-soft sm:bottom-20 sm:w-32">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt={`Photo réelle du Monster — ${selected.name}`} className="h-28 w-full object-contain sm:h-36"/>
        <span className="block text-center text-[10px] font-bold">Photo réelle ↗</span>
      </a>}
    </div>}
    <div className="space-y-3 md:hidden" aria-label="Couleur du porte-canette">
      <p className="text-sm font-bold">Coloris — {selected.name}</p>
      <div className="flex flex-wrap gap-2.5">{colors.map(color=><button key={color.name} type="button" disabled={!isAvailable(color)} aria-pressed={selected.hex===color.hex} aria-label={`Coloris ${publicColorName(color.name)}${isAvailable(color)?"":" — Rupture de stock"}`} onClick={()=>choose(color)} style={colorSwatchStyle(color)} className={`h-8 w-8 rounded-full border-2 disabled:opacity-60 ${!isAvailable(color)?"color-swatch-unavailable":""} ${selected.name===publicColorName(color.name)?"border-terra":"border-sand"}`}/>)}</div>
      {colors.some(color=>!isAvailable(color))&&<p className="text-xs text-ink-soft">Coloris barrés : rupture de stock.</p>}
      {selected.name.toLowerCase().includes("phosphorescent")&&<p className="text-xs text-ink-soft">Vert phosphorescent : brille dans l’obscurité après exposition à la lumière.</p>}
    </div>
    {view==="photo"&&<Gallery images={images} videoUrl={videoUrl} name={name} imageFit="contain"/>}
  </div>;
}
