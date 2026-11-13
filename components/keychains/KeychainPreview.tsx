"use client";
import { useEffect, useMemo, useState } from "react";
import opentype, { type Font } from "opentype.js";
import { KEYCHAIN_FONTS, type KeychainConfiguration } from "@/lib/name-keychain";
import { keychainShapes } from "@/lib/name-keychain-3d";
const fonts=new Map<string,Promise<Font>>();
function loadFont(id:string){
  if(!fonts.has(id))fonts.set(id,fetch(`/fonts/${KEYCHAIN_FONTS.find(font=>font.id===id)!.file}`).then(response=>{if(!response.ok)throw new Error("Police indisponible.");return response.arrayBuffer();}).then(buffer=>opentype.parse(buffer)).catch(error=>{fonts.delete(id);throw error;}));
  return fonts.get(id)!;
}
export default function KeychainPreview({configuration,onValidity}:{configuration:KeychainConfiguration;onValidity:(valid:boolean)=>void}){
  const [loaded,setLoaded]=useState<{id:string;font:Font}|null>(null),[fontError,setFontError]=useState("");
  useEffect(()=>{let active=true;loadFont(configuration.font).then(font=>{if(active){setLoaded({id:configuration.font,font});setFontError("");}}).catch(()=>{if(active)setFontError("Impossible de charger la police.");});return()=>{active=false;};},[configuration.font]);
  const result=useMemo(()=>{
    if(!loaded||loaded.id!==configuration.font)return {shapes:null,error:fontError||"Chargement de votre aperçu…"};
    try{return {shapes:keychainShapes(configuration,loaded.font),error:""};}catch(error){return {shapes:null,error:error instanceof Error?error.message:"Aperçu indisponible."};}
  },[loaded,configuration,fontError]);
  useEffect(()=>{onValidity(Boolean(result.shapes));},[result,onValidity]);
  return <div className="rounded-2xl border border-sand bg-[#f5f0e8] p-5 sm:p-8">
    <p className="mb-4 text-xs font-bold uppercase tracking-wider text-ink-soft">Votre porte-clés</p>
    {result.shapes?<><svg viewBox={result.shapes.viewBox} role="img" aria-label={`Porte-clés ${configuration.name}, ${configuration.baseColorName} et ${configuration.textColorName}`} className="aspect-[2/1] w-full overflow-visible drop-shadow-lg"><g transform={`translate(0 ${result.shapes.previewFlipY}) scale(1 -1)`}><path d={result.shapes.basePath} fill={configuration.baseColor} fillRule="evenodd" stroke="#00000018" strokeWidth={0.12}/><path d={result.shapes.lettersPath} fill={configuration.textColor} fillRule="evenodd" stroke="#00000020" strokeWidth={0.08}/></g></svg><p className="mt-5 text-xs text-ink-soft">Environ {Math.round(result.shapes.width)} × {Math.round(result.shapes.height)} mm · épaisseur 3,6 mm · fond {configuration.borderWidthMm?.toFixed(1).replace(".",",")} mm · œillet renforcé</p></>:<p role="status" className="grid min-h-48 place-items-center text-center text-sm">{result.error}</p>}
    <p className="mt-3 text-[11px] text-ink-soft">Aperçu de la forme et des couleurs. Le rendu du filament peut légèrement varier.</p>
  </div>;
}
