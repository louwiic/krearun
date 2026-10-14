/* eslint-disable @next/next/no-img-element -- Prepared logos and protected customer files must load directly. */
"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { ProductColor } from "@/lib/types";
import { HOLDER_MODELS, LOGO_MAX_BYTES, isHolderBodyColor, type HolderModel, type HolderConfiguration } from "@/lib/custom-holder";
import { recolorLogoPixels } from "@/lib/logo-palette";
import { publicColorName } from "@/lib/colors";

const Preview=dynamic(()=>import('./HolderPreview3D'),{ssr:false,loading:()=> <div className="flex h-[400px] items-center justify-center border-2 border-ink bg-cream text-sm">Chargement de l’aperçu 3D…</div>});
const field='w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm outline-none focus:border-terra';

export default function HolderConfigurator({colors,signedIn}:{colors:ProductColor[];signedIn:boolean}) {
  const bodyColors=colors.filter(isHolderBodyColor);
  const [color,setColor]=useState(bodyColors.find(c=>publicColorName(c.name).toLowerCase()==='noir')??bodyColors[0]);
  const [model,setModel]=useState<HolderModel>('custom');
  const [logoWidth,setLogoWidth]=useState(45);const [verticalName,setVerticalName]=useState(''),[engravingText,setEngravingText]=useState('');
  const [ringColor,setRingColor]=useState<string>();
  const [file,setFile]=useState<File>();const [logo,setLogo]=useState('');const [palette,setPalette]=useState<string[]>([]);
  const [logoColors,setLogoColors]=useState<string[]>([]);const [activeLogoColor,setActiveLogoColor]=useState(0);const [displayLogo,setDisplayLogo]=useState('');
  const [reduced,setReduced]=useState(false);const [confirmed,setConfirmed]=useState(false);
  const [quantity,setQuantity]=useState(1);const [note,setNote]=useState('');
  const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [uploading,setUploading]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const nonce=useRef('');const controller=useRef<AbortController|null>(null);
  useEffect(()=>{nonce.current=crypto.randomUUID();return()=>controller.current?.abort();},[]);
  useEffect(()=>{
    if(!logo){queueMicrotask(()=>setDisplayLogo(''));return;}
    let cancelled=false;const image=new Image();
    image.onload=()=>{if(cancelled)return;const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const context=canvas.getContext('2d');if(!context)return;context.drawImage(image,0,0);const pixels=context.getImageData(0,0,canvas.width,canvas.height);pixels.data.set(recolorLogoPixels(pixels.data,palette,logoColors));context.putImageData(pixels,0,0);setDisplayLogo(canvas.toDataURL('image/png'));};image.src=logo;
    return()=>{cancelled=true;};
  },[logo,palette,logoColors]);
  if(!color)return <p>La personnalisation sera disponible dès que le noir ou le blanc seront ajoutés à l’inventaire.</p>;
  const configuration:HolderConfiguration={model,...(model==='custom'?{logoFaces:2 as const}:{}),bodyColor:color.hex,bodyColorName:color.name,logoWidth,logoOffset:0,verticalName,engravingText,topColor:ringColor??color.hex,bottomColor:ringColor??color.hex,...(logoColors.length?{logoColors}:{})};
  async function upload(selected?:File, selectedModel:HolderModel=model) {
    controller.current?.abort();const abort=new AbortController();controller.current=abort;
    setFile(undefined);setLogo('');setPalette([]);setLogoColors([]);setActiveLogoColor(0);setConfirmed(false);setReduced(false);setError('');
    if(!selected&&selectedModel==='custom'){setUploading(false);return;}
    if(selected&&selected.size>LOGO_MAX_BYTES){setUploading(false);setError('Le fichier doit peser moins de 5 Mo.');return;}
    setUploading(true);
    try {
      const form=new FormData();form.set('model',selectedModel);if(selected)form.set('logo',selected);
      const response=await fetch('/api/porte-boisson/logo',{method:'POST',body:form,signal:abort.signal});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'Logo invalide.');
      if(abort.signal.aborted)return;
      setFile(selected);setLogo(result.logo);setPalette(result.palette);setLogoColors(result.palette);setReduced(result.reduced);nonce.current=crypto.randomUUID();
    }catch(e){if(!abort.signal.aborted)setError(e instanceof Error?e.message:'Logo invalide.');}
    finally{if(!abort.signal.aborted)setUploading(false);}
  }
  async function submit(event:React.FormEvent) {
    event.preventDefault();if(!logo||(model==='custom'&&!file)||!confirmed||busy||uploading)return;
    setBusy(true);setError('');
    try {
      const form=new FormData();if(file)form.set('logo',file);form.set('configuration',JSON.stringify(configuration));form.set('quantity',String(quantity));form.set('note',note);form.set('confirmed','true');form.set('submissionKey',nonce.current);
      const response=await fetch('/api/porte-boisson/demandes',{method:'POST',body:form});const result=await response.json();
      if(!response.ok)throw new Error(result.error||'Envoi impossible.');
      setSubmitted(true);
    }catch(e){setError(e instanceof Error?e.message:'Envoi impossible.');}finally{setBusy(false);}
  }
  if(submitted)return <div role="status" className="rounded-2xl border-2 border-ink bg-sage/20 p-8"><h2 className="font-display text-3xl">Demande envoyée !</h2><p className="mt-4">Nous allons vérifier votre logo et la faisabilité de l’impression. Aucun paiement n’est demandé maintenant.</p><p className="mt-3">Vous retrouverez notre réponse et, si la demande est acceptée, le prix et le bouton de paiement dans votre espace client.</p><Link href="/compte#personnalisations" className="mt-6 inline-flex rounded-full bg-ink px-6 py-3 font-bold text-cream">Voir ma demande →</Link></div>;
  return <div className="grid items-start gap-8 lg:grid-cols-[1.1fr_1fr]">
    <div className="lg:sticky lg:top-28"><Preview configuration={configuration} logo={displayLogo||logo||undefined}/>
      <fieldset disabled={busy} className="mt-5"><legend className="text-sm font-bold">Choisissez votre modèle</legend><div className="mt-3 grid grid-cols-3 gap-2">{HOLDER_MODELS.map(option=><button key={option.id} type="button" aria-pressed={model===option.id} onClick={()=>{setModel(option.id);if(option.id!=='custom')setColor(colors.find(c=>publicColorName(c.name).toLowerCase()==='blanc')??color);void upload(undefined,option.id);}} className={`min-w-0 overflow-hidden rounded-xl border-2 p-1 text-left transition ${model===option.id?'border-terra bg-terra/5':'border-sand bg-white'}`}><Preview thumbnail configuration={{...configuration,model:option.id,logoColors:undefined,bodyColor:option.id==='custom'?color.hex:'#ffffff'}}/><span className="block px-2 pt-2 text-sm font-bold">{option.label}</span><span className="block px-2 pb-2 pt-1 text-[10px] leading-4 text-ink-soft">{option.description}</span></button>)}</div></fieldset>
      {logo&&<div className="mt-4 flex items-center gap-4 rounded-xl bg-cream p-4"><img src={displayLogo||logo} alt="Votre logo préparé pour l’impression" className="h-20 w-20 rounded-lg border border-sand bg-white object-contain"/><div><p className="text-sm font-bold">{new Set(logoColors).size} couleur(s) dans le logo</p><div className="mt-2 flex gap-2">{[...new Set(logoColors)].map(hex=><span key={hex} title={hex} className="h-5 w-5 rounded-full border border-black/20" style={{backgroundColor:hex}}/>)}</div></div></div>}
    </div>
    <form onSubmit={submit} className="space-y-6">
      <fieldset disabled={busy} className="space-y-6 disabled:opacity-70">
        {model==='custom'?<div><label htmlFor="holder-logo" className="block text-sm font-bold">1. Importez votre logo</label><input id="holder-logo" type="file" accept=".svg,image/svg+xml,image/png,image/jpeg,image/webp" onChange={e=>void upload(e.target.files?.[0])} className="mt-3 block w-full rounded-xl border-2 border-ink bg-cream p-3 text-sm file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-terra file:px-5 file:py-3 file:font-bold file:text-white hover:file:bg-terra-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terra"/><p className="mt-2 text-xs leading-5 text-ink-soft">SVG recommandé pour des contours nets, ou PNG sur fond transparent. JPG et WebP acceptés • 5 Mo maximum • 4 couleurs maximum.</p><p className="mt-2 text-sm font-bold">Votre logo sera placé sur les deux côtés opposés du porte-boisson.</p>{uploading&&<p role="status" className="mt-2 text-sm">Préparation du logo…</p>}{reduced&&<p className="mt-3 rounded-xl bg-blush/30 p-3 text-sm">Votre fichier contenait plus de quatre couleurs. L’aperçu a été simplifié : vérifiez bien les détails et les teintes avant l’envoi.</p>}</div>:<div className="rounded-xl bg-cream p-4 text-sm leading-6"><p className="font-bold">Modèle {model.toUpperCase()}</p><p>Le logo en relief, les décors et leur placement reprennent notre modèle déjà réalisé. Le corps est noir ou blanc. Les couleurs du logo sont personnalisables.</p>{uploading&&<p role="status">Préparation du modèle…</p>}</div>}
        <fieldset><legend className="text-sm font-bold">2. Couleur du corps — {publicColorName(color.name)}</legend><div className="mt-3 flex flex-wrap gap-2">{bodyColors.map(c=><button key={`${c.name}-${c.hex}`} type="button" title={publicColorName(c.name)} aria-label={publicColorName(c.name)} aria-pressed={c.name===color.name} onClick={()=>{setColor(c);setConfirmed(false);}} className={`h-9 w-9 rounded-full border-2 ${c.name===color.name?'border-terra ring-2 ring-terra/25 ring-offset-2':'border-ink/20'}`} style={{backgroundColor:c.hex}}/>)}</div></fieldset>
        <fieldset><legend className="text-sm font-bold">Couleur des bagues — haut et bas</legend><p className="mt-2 text-xs text-ink-soft">La même couleur est appliquée aux deux bagues vissées.</p><div className="mt-3 flex flex-wrap gap-2">{colors.map(c=><button key={`${c.name}-${c.hex}`} type="button" aria-label={`Couleur des bagues : ${publicColorName(c.name)}`} title={publicColorName(c.name)} aria-pressed={(ringColor??color.hex)===c.hex} onClick={()=>{setRingColor(c.hex);setConfirmed(false);}} className={`h-9 w-9 rounded-full border-2 ${(ringColor??color.hex)===c.hex?'border-terra ring-2 ring-terra/25 ring-offset-2':'border-ink/20'}`} style={{backgroundColor:c.hex}}/>)}</div></fieldset>
        {palette.length>0&&<fieldset><legend className="text-sm font-bold">3. Couleurs du logo — {new Set(logoColors).size}/4</legend><p className="mt-2 text-xs leading-5 text-ink-soft">Sélectionnez une couleur du logo, puis remplacez-la par un coloris de l’atelier.</p><div className="mt-3 flex flex-wrap gap-2">{palette.map((original,index)=><button key={`${index}-${original}`} type="button" aria-pressed={activeLogoColor===index} onClick={()=>setActiveLogoColor(index)} className={`flex items-center gap-2 rounded-full border-2 px-3 py-2 text-xs font-bold ${activeLogoColor===index?'border-terra':'border-sand'}`}><span className="h-5 w-5 rounded-full border border-black/20" style={{backgroundColor:logoColors[index]}}/>Couleur {index+1}</button>)}</div><div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={`Remplacer la couleur ${activeLogoColor+1} du logo`}>{colors.map(c=><button key={`${c.name}-${c.hex}`} type="button" aria-label={`Logo : ${publicColorName(c.name)}`} title={publicColorName(c.name)} aria-pressed={logoColors[activeLogoColor]===c.hex.toLowerCase()} onClick={()=>{setLogoColors(current=>current.map((hex,index)=>index===activeLogoColor?c.hex.toLowerCase():hex));setConfirmed(false);}} className={`h-9 w-9 rounded-full border-2 ${logoColors[activeLogoColor]===c.hex.toLowerCase()?'border-terra ring-2 ring-terra/25 ring-offset-2':'border-ink/20'}`} style={{backgroundColor:c.hex}}/>)}</div><button type="button" onClick={()=>{setLogoColors([...palette]);setConfirmed(false);}} className="mt-3 text-xs font-bold text-terra underline">Rétablir les couleurs du logo</button></fieldset>}
        {model==='custom'&&<div className="space-y-4"><label className="block text-sm font-bold">Largeur du logo : {logoWidth} mm<input aria-label="Largeur du logo" className="mt-2 block w-full accent-terra" type="range" min="25" max="65" value={logoWidth} onChange={e=>{setLogoWidth(Number(e.target.value));setConfirmed(false);}}/></label><p className="text-xs text-ink-soft">Le logo reste centré sur le porte-boisson.</p></div>}
        <label className="block text-sm font-bold">Prénom vertical (facultatif)<input value={verticalName} maxLength={12} onChange={e=>{setVerticalName(e.target.value);setConfirmed(false);}} className={`${field} mt-2`} placeholder="Ex. LOÏC"/><span className="mt-2 block text-xs font-normal text-ink-soft">Gravé lettre par lettre entre les deux logos, du côté opposé à la poignée. 12 caractères maximum.</span></label>
        <label className="block text-sm font-bold">Texte gravé sous les logos (facultatif)<input value={engravingText} maxLength={32} onChange={e=>{setEngravingText(e.target.value);setConfirmed(false);}} className={`${field} mt-2`} placeholder="Ex. Mon porte-boisson"/><span className="mt-2 block text-xs font-normal text-ink-soft">Le même texte sous chaque logo, dans la matière du corps. 32 caractères maximum.</span></label>
        <label className="block text-sm font-bold">Quantité<input type="number" min="1" max="20" required value={quantity} onChange={e=>setQuantity(Number(e.target.value))} className={`${field} mt-2 max-w-28`}/></label>
        <label className="block text-sm font-bold">Un détail à nous préciser ?<textarea value={note} maxLength={1000} onChange={e=>setNote(e.target.value)} className={`${field} mt-2`} rows={3} placeholder="Votre demande ou les détails importants du logo…"/></label>
        {!signedIn&&<div className="rounded-xl bg-cream p-4 text-sm leading-6"><p className="font-bold">Un compte pour suivre votre demande</p><p className="mt-2"><Link href="/compte" target="_blank" className="font-bold text-terra underline">Connectez-vous</Link> ou <Link href="/compte/inscription" target="_blank" className="font-bold text-terra underline">créez votre compte</Link> dans un nouvel onglet, puis revenez ici pour envoyer votre demande. Votre logo reste sur cette page.</p></div>}
        <label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" checked={confirmed} disabled={!logo||uploading} onChange={e=>setConfirmed(e.target.checked)} className="mt-1" required/><span>J’ai vérifié le logo préparé en quatre couleurs maximum et son placement. Je peux utiliser ce logo pour cette personnalisation.</span></label>
        {error&&<p role="alert" className="rounded-xl bg-blush/30 p-4 text-sm font-semibold">{error}</p>}
        <button disabled={busy||uploading||!logo||(model==='custom'&&!file)||!confirmed} className="w-full rounded-full bg-terra px-6 py-4 font-bold text-white hover:bg-terra-deep disabled:opacity-50">{busy?'Envoi en cours…':'Envoyer ma demande de validation →'}</button>
        <p className="text-center text-xs leading-5 text-ink-soft">Nous vérifions la faisabilité et vous proposons un prix. Vous payez uniquement après notre validation, depuis votre compte.</p>
      </fieldset>
    </form>
  </div>;
}
