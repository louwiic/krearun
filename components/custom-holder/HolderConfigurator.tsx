/* eslint-disable @next/next/no-img-element -- Prepared logos and protected customer files must load directly. */
"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { ProductColor } from "@/lib/types";
import { LOGO_MAX_BYTES, type HolderConfiguration } from "@/lib/custom-holder";
import { publicColorName } from "@/lib/colors";

const Preview=dynamic(()=>import('./HolderPreview3D'),{ssr:false,loading:()=> <div className="flex h-[400px] items-center justify-center border-2 border-ink bg-cream text-sm">Chargement de l’aperçu 3D…</div>});
const field='w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm outline-none focus:border-terra';

export default function HolderConfigurator({colors,signedIn}:{colors:ProductColor[];signedIn:boolean}) {
  const [color,setColor]=useState(colors.find(c=>publicColorName(c.name).toLowerCase()==='noir')??colors[0]);
  const [logoWidth,setLogoWidth]=useState(45);const [logoOffset,setLogoOffset]=useState(0);
  const [file,setFile]=useState<File>();const [logo,setLogo]=useState('');const [palette,setPalette]=useState<string[]>([]);
  const [reduced,setReduced]=useState(false);const [confirmed,setConfirmed]=useState(false);
  const [quantity,setQuantity]=useState(1);const [note,setNote]=useState('');
  const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [uploading,setUploading]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const nonce=useRef('');const controller=useRef<AbortController|null>(null);
  useEffect(()=>{nonce.current=crypto.randomUUID();return()=>controller.current?.abort();},[]);
  if(!color)return <p>La personnalisation sera disponible dès que des coloris auront été ajoutés à l’inventaire.</p>;
  const configuration:HolderConfiguration={bodyColor:color.hex,bodyColorName:color.name,logoWidth,logoOffset};
  async function upload(selected?:File) {
    controller.current?.abort();const abort=new AbortController();controller.current=abort;
    setFile(undefined);setLogo('');setPalette([]);setConfirmed(false);setReduced(false);setError('');
    if(!selected){setUploading(false);return;}
    if(selected.size>LOGO_MAX_BYTES){setUploading(false);setError('Le fichier doit peser moins de 5 Mo.');return;}
    setUploading(true);
    try {
      const form=new FormData();form.set('logo',selected);
      const response=await fetch('/api/porte-boisson/logo',{method:'POST',body:form,signal:abort.signal});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'Logo invalide.');
      if(abort.signal.aborted)return;
      setFile(selected);setLogo(result.logo);setPalette(result.palette);setReduced(result.reduced);nonce.current=crypto.randomUUID();
    }catch(e){if(!abort.signal.aborted)setError(e instanceof Error?e.message:'Logo invalide.');}
    finally{if(!abort.signal.aborted)setUploading(false);}
  }
  async function submit(event:React.FormEvent) {
    event.preventDefault();if(!file||!confirmed||busy)return;
    setBusy(true);setError('');
    try {
      const form=new FormData();form.set('logo',file);form.set('configuration',JSON.stringify(configuration));form.set('quantity',String(quantity));form.set('note',note);form.set('confirmed','true');form.set('submissionKey',nonce.current);
      const response=await fetch('/api/porte-boisson/demandes',{method:'POST',body:form});const result=await response.json();
      if(!response.ok)throw new Error(result.error||'Envoi impossible.');
      setSubmitted(true);
    }catch(e){setError(e instanceof Error?e.message:'Envoi impossible.');}finally{setBusy(false);}
  }
  if(submitted)return <div role="status" className="rounded-2xl border-2 border-ink bg-sage/20 p-8"><h2 className="font-display text-3xl">Demande envoyée !</h2><p className="mt-4">Nous allons vérifier votre logo et la faisabilité de l’impression. Aucun paiement n’est demandé maintenant.</p><p className="mt-3">Vous retrouverez notre réponse et, si la demande est acceptée, le prix et le bouton de paiement dans votre espace client.</p><Link href="/compte#personnalisations" className="mt-6 inline-flex rounded-full bg-ink px-6 py-3 font-bold text-cream">Voir ma demande →</Link></div>;
  return <div className="grid items-start gap-8 lg:grid-cols-[1.1fr_1fr]">
    <div className="lg:sticky lg:top-28"><Preview configuration={configuration} logo={logo||undefined}/>
      {logo&&<div className="mt-4 flex items-center gap-4 rounded-xl bg-cream p-4"><img src={logo} alt="Votre logo préparé pour l’impression" className="h-20 w-20 rounded-lg border border-sand bg-white object-contain"/><div><p className="text-sm font-bold">{palette.length} couleur(s) dans le logo</p><div className="mt-2 flex gap-2">{palette.map(hex=><span key={hex} title={hex} className="h-5 w-5 rounded-full border border-black/20" style={{backgroundColor:hex}}/>)}</div></div></div>}
    </div>
    <form onSubmit={submit} className="space-y-6">
      <fieldset disabled={busy} className="space-y-6 disabled:opacity-70">
        <div><label htmlFor="holder-logo" className="block text-sm font-bold">1. Importez votre logo</label><input id="holder-logo" type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>void upload(e.target.files?.[0])} className="mt-3 block max-w-full text-sm"/><p className="mt-2 text-xs leading-5 text-ink-soft">PNG, JPG ou WebP • 5 Mo maximum • 4 couleurs maximum. Privilégiez un PNG sur fond transparent.</p>{uploading&&<p role="status" className="mt-2 text-sm">Préparation du logo…</p>}{reduced&&<p className="mt-3 rounded-xl bg-blush/30 p-3 text-sm">Votre fichier contenait plus de quatre couleurs. L’aperçu a été simplifié : vérifiez bien les détails et les teintes avant l’envoi.</p>}</div>
        <fieldset><legend className="text-sm font-bold">2. Couleur du porte-boisson — {publicColorName(color.name)}</legend><div className="mt-3 flex flex-wrap gap-2">{colors.map(c=><button key={`${c.name}-${c.hex}`} type="button" title={publicColorName(c.name)} aria-label={publicColorName(c.name)} aria-pressed={c.name===color.name} onClick={()=>{setColor(c);setConfirmed(false);}} className={`h-9 w-9 rounded-full border-2 ${c.name===color.name?'border-terra ring-2 ring-terra/25 ring-offset-2':'border-ink/20'}`} style={{backgroundColor:c.hex}}/>)}</div></fieldset>
        <div className="space-y-4"><label className="block text-sm font-bold">Largeur du logo : {logoWidth} mm<input aria-label="Largeur du logo" className="mt-2 block w-full accent-terra" type="range" min="25" max="65" value={logoWidth} onChange={e=>{setLogoWidth(Number(e.target.value));setConfirmed(false);}}/></label><label className="block text-sm font-bold">Position verticale<input aria-label="Position verticale du logo" className="mt-2 block w-full accent-terra" type="range" min="-25" max="25" value={logoOffset} onChange={e=>{setLogoOffset(Number(e.target.value));setConfirmed(false);}}/></label></div>
        <label className="block text-sm font-bold">Quantité<input type="number" min="1" max="20" required value={quantity} onChange={e=>setQuantity(Number(e.target.value))} className={`${field} mt-2 max-w-28`}/></label>
        <label className="block text-sm font-bold">Un détail à nous préciser ?<textarea value={note} maxLength={1000} onChange={e=>setNote(e.target.value)} className={`${field} mt-2`} rows={3} placeholder="Votre demande ou les détails importants du logo…"/></label>
        {!signedIn&&<div className="rounded-xl bg-cream p-4 text-sm leading-6"><p className="font-bold">Un compte pour suivre votre demande</p><p className="mt-2"><Link href="/compte" target="_blank" className="font-bold text-terra underline">Connectez-vous</Link> ou <Link href="/compte/inscription" target="_blank" className="font-bold text-terra underline">créez votre compte</Link> dans un nouvel onglet, puis revenez ici pour envoyer votre demande. Votre logo reste sur cette page.</p></div>}
        <label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" checked={confirmed} disabled={!logo||uploading} onChange={e=>setConfirmed(e.target.checked)} className="mt-1" required/><span>J’ai vérifié le logo préparé en quatre couleurs maximum et son placement. Je peux utiliser ce logo pour cette personnalisation.</span></label>
        {error&&<p role="alert" className="rounded-xl bg-blush/30 p-4 text-sm font-semibold">{error}</p>}
        <button disabled={busy||uploading||!file||!confirmed} className="w-full rounded-full bg-terra px-6 py-4 font-bold text-white hover:bg-terra-deep disabled:opacity-50">{busy?'Envoi en cours…':'Envoyer ma demande de validation →'}</button>
        <p className="text-center text-xs leading-5 text-ink-soft">Nous vérifions la faisabilité et vous proposons un prix. Vous payez uniquement après notre validation, depuis votre compte.</p>
      </fieldset>
    </form>
  </div>;
}
