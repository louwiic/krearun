"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import Gallery from "./Gallery";
import { MONSTER_COLOR_EVENT, monsterRealPhoto } from "@/lib/monster-preview";
import type { Product, ProductColor } from "@/lib/types";
import MonsterGiftPreview from "./MonsterGiftPreview";
import { useColorAvailability, useProductColors } from "./ColorAvailabilityProvider";
import { colorSwatchStyle } from "@/lib/color-swatches";
import { monsterColorLabel, MONSTER_PREMIUM_COLORS, isMonsterPremium, type MonsterColors } from "@/lib/monster-multicolor";
import { publicColorName } from "@/lib/colors";
const MonsterPreview3D=dynamic(()=>import("./MonsterPreview3D"),{ssr:false,loading:()=><p role="status" className="flex h-[390px] items-center justify-center rounded-2xl border-2 border-ink bg-cream text-sm sm:h-[520px]">Chargement de l’aperçu 3D…</p>});

function UprightPremiumPhoto({src,className}:{src:string;className:string}) {
  return <svg viewBox="-750 -800 1500 1600" role="img" aria-label="Photo réelle du Monster noir, argenté et doré, debout" className={className}>
    <image href={src} x="-550" y="-407.5" width="1100" height="815" transform="rotate(115)" preserveAspectRatio="xMidYMid meet"/>
  </svg>;
}

export default function MonsterProductGallery({product,images,videoUrl,name,initialColor}:{product:Product;images:string[];videoUrl:string;name:string;initialColor:ProductColor}) {
  const isAvailable=useColorAvailability();
  const {colors}=useProductColors(product);
  const [selected,setSelected]=useState(initialColor);
  const [mixed,setMixed]=useState<MonsterColors|undefined>();
  const premium=isMonsterPremium(mixed);
  const photoColorName=premium?"Noir et argenté":selected.name;
  const photo=premium ? "/products/monster/noir-argente-real.webp" : mixed ? undefined : monsterRealPhoto(selected.name);
  const colorHex=(name:string)=>name==="Argenté"?"#c5c8cc":colors.find(c=>publicColorName(c.name)===name)?.hex || selected.hex;
  const previewParts=mixed ? {top:colorHex(mixed.top),bottom:colorHex(mixed.bottom),claws:colorHex(mixed.claws)} : undefined;
  function mix(parts:MonsterColors|undefined) {
    window.dispatchEvent(new CustomEvent(MONSTER_COLOR_EVENT,{detail:{name:selected.name,hex:selected.hex,parts}}));
  }
  const photoDialog=useRef<HTMLDialogElement>(null);
  const [photoOpen,setPhotoOpen]=useState(false);
  useEffect(()=>{
    if(photoOpen) photoDialog.current?.showModal();
    else photoDialog.current?.close();
  },[photoOpen]);
  function choose(color:ProductColor) {
    window.dispatchEvent(new CustomEvent(MONSTER_COLOR_EVENT,{detail:{name:publicColorName(color.name),hex:color.hex}}));
  }
  const [view,setView]=useState("3d");
  const [hasPreview,setHasPreview]=useState(true);
  useEffect(()=>{
    function select(event:Event) {
      const color=(event as CustomEvent<ProductColor & {parts?:MonsterColors}>).detail;
      if(!color||!/^#[a-f0-9]{6}$/i.test(color.hex)||!color.name)return;
      setMixed(color.parts);setSelected(color);setHasPreview(true);setView("3d");
    }
    window.addEventListener(MONSTER_COLOR_EVENT,select);
    return()=>window.removeEventListener(MONSTER_COLOR_EVENT,select);
  },[]);
  return <div className="min-w-0 space-y-3">
    <dialog ref={photoDialog} aria-label={`Photo réelle du Monster — ${photoColorName}`} onClose={()=>setPhotoOpen(false)} onClick={event=>{if(event.target===event.currentTarget)setPhotoOpen(false);}} className="fixed inset-0 m-auto max-h-[95dvh] w-[min(92vw,800px)] overflow-visible rounded-2xl bg-cream p-4 pt-16 shadow-xl backdrop:bg-black/80">
      <button type="button" autoFocus onClick={()=>setPhotoOpen(false)} aria-label="Fermer la photo réelle" className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-ink text-2xl text-white">×</button>
      {photo && <>
        {premium ? <UprightPremiumPhoto src={photo} className="mx-auto h-[70dvh] w-full"/> :
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt={`Photo réelle du Monster — ${photoColorName}`} className="mx-auto max-h-[75dvh] w-full object-contain"/>}</>}
      <p className="mt-2 text-center text-sm">{photoColorName}</p>
    </dialog>
    {premium ? <p className="text-sm font-bold">Photo réelle · Noir et argenté</p> : <div className="flex gap-2" role="group" aria-label="Vue du porte-canette Monster">
      <button type="button" aria-pressed={view==="3d"} onClick={()=>{setHasPreview(true);setView("3d");}} className={`rounded-full border px-5 py-2 text-sm font-semibold ${view==="3d"?"border-ink bg-ink text-white":"border-sand"}`}>Aperçu 3D</button>
      <button type="button" aria-pressed={view==="photo"} onClick={()=>setView("photo")} className={`rounded-full border px-5 py-2 text-sm font-semibold ${view==="photo"?"border-ink bg-ink text-white":"border-sand"}`}>Photo réelle</button>
    </div>}
    {hasPreview&&<div hidden={view!=="3d"&&!premium} className="relative">
      {premium ? <button type="button" onClick={()=>setPhotoOpen(true)} aria-label="Agrandir la photo réelle — Noir et argenté" className="block w-full overflow-hidden rounded-2xl border-2 border-ink bg-cream p-4">
        <UprightPremiumPhoto src={photo!} className="h-[390px] w-full sm:h-[520px]"/>
        <span className="block py-2 text-xs font-bold">Photo réelle · Agrandir ↗</span>
      </button> : <MonsterPreview3D color={selected.hex} colorName={mixed?"Multicolore":selected.name} parts={previewParts}/>}
      <div className="pointer-events-none absolute right-3 top-16 flex flex-col items-center rounded-xl bg-white/90 p-2 shadow-soft">
        <MonsterGiftPreview color={previewParts?.claws || selected.hex} colorName={mixed?.claws || selected.name}/>
        <span className="text-[10px] font-bold">Porte-clés offert</span>
      </div>
      {photo && !premium && <button type="button" onClick={()=>setPhotoOpen(true)} aria-label={`Agrandir la photo réelle — ${selected.name}`} className="absolute bottom-24 right-3 w-24 rounded-xl border border-sand bg-white/90 p-2 shadow-soft sm:bottom-20 sm:w-32">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt={`Photo réelle du Monster — ${photoColorName}`} className="h-28 w-full object-contain sm:h-36"/>
        <span className="block text-center text-[10px] font-bold">Photo réelle ↗</span>
      </button>}
    </div>}
    <div className="space-y-3" aria-label="Couleur du porte-canette">
      <p className="text-sm font-bold">Coloris — {premium?"Noir et argenté":mixed?"Multicolore":selected.name}</p>
      <div className="flex flex-wrap gap-2.5">{colors.map(color=><button key={color.name} type="button" disabled={!isAvailable(color)} aria-pressed={selected.hex===color.hex} aria-label={`Coloris ${publicColorName(color.name)}${isAvailable(color)?"":" — Rupture de stock"}`} onClick={()=>choose(color)} style={colorSwatchStyle(color)} className={`relative h-8 w-8 rounded-full border-2 disabled:opacity-60 ${!isAvailable(color)?"color-swatch-unavailable":""} ${selected.name===publicColorName(color.name)?"border-terra":"border-sand"}`}/>)}</div>
      <div className="space-y-2 rounded-xl border border-sand bg-white/60 p-3">
        <p className="text-sm font-bold">Couleur premium</p>
        <button type="button" aria-pressed={premium} onClick={()=>mix(premium?undefined:MONSTER_PREMIUM_COLORS)} className={`flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left text-sm ${premium?"border-terra":"border-sand"}`}>
          <span aria-hidden className="h-8 w-8 shrink-0 rounded-full border border-ink/20" style={{background:"linear-gradient(135deg,#111313 50%,#c5c8cc 50%)"}}/>
          <span><span className="block font-bold">Noir et argenté · +2 €</span><span className="text-xs text-ink-soft">Haut et bas noirs, griffes argentées</span></span>
        </button>
      </div>
      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-sand bg-white/60 p-3 text-sm font-bold">
        <input type="checkbox" checked={Boolean(mixed)&&!premium} onChange={event=>mix(event.target.checked?{top:selected.name,bottom:selected.name,claws:selected.name}:undefined)} className="h-5 w-5 accent-terra"/>
        Duo de couleurs · +2 € par pièce
      </label>
      {mixed && !premium && <fieldset className="space-y-3 rounded-xl border border-sand p-3">
        <legend className="px-1 text-sm font-bold">Composez votre duo de couleurs</legend>
        {([['top','Haut et bas'],['claws','Griffes']] as const).map(([key,label])=><label key={key} className="flex items-center justify-between gap-3 text-sm"><span>{label}</span><select aria-label={`Couleur ${label.toLowerCase()}`} value={mixed[key]} onChange={event=>mix(key==="top"?{...mixed,top:event.target.value,bottom:event.target.value}:{...mixed,claws:event.target.value})} className="min-w-0 max-w-[70%] rounded-lg border border-sand bg-white p-2">{colors.filter(isAvailable).map(color=><option key={color.name} value={publicColorName(color.name)}>{publicColorName(color.name)}</option>)}</select></label>)}
        <p className="text-xs text-ink-soft">{monsterColorLabel(mixed)}. Haut et bas assortis. Corps et poignée noirs. Le porte-clés offert reprend la couleur des griffes.</p>
      </fieldset>}
      {colors.some(color=>!isAvailable(color))&&<p className="text-xs text-ink-soft">Coloris barrés : rupture de stock.</p>}
      {selected.name.toLowerCase().includes("phosphorescent")&&<p className="text-xs text-ink-soft">Vert phosphorescent : brille dans l’obscurité après exposition à la lumière.</p>}
    </div>
    {view==="photo"&&!premium&&<Gallery images={images} videoUrl={videoUrl} name={name} imageFit="contain"/>}
  </div>;
}
