"use client";
import { useRef, useState } from "react";
import { formatPrice } from "@/lib/format";

export default function NosPersonalization({value,onChange,priceCents}:{value:string;onChange:(value:string,enabled:boolean)=>void;priceCents:number}) {
  const [mode,setMode] = useState("none");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [fileName,setFileName] = useState("");
  const sequence = useRef(0);
  function choose(next:string) { sequence.current++; setMode(next); onChange("",next!=="none"); setError(""); setBusy(false); setFileName(""); }
  async function upload(file:File|undefined) {
    const current = ++sequence.current;
    onChange("",true); setError(""); setFileName("");
    if (!file) return;
    if(file.size>5*1024*1024 || !["image/png","image/jpeg","image/webp"].includes(file.type)){setError("Choisissez un PNG, JPEG ou WebP de 5 Mo maximum.");return;}
    setBusy(true);
    try {
      const form=new FormData();form.set("logo",file);
      const response=await fetch("/api/nos/logo",{method:"POST",body:form});
      const data=await response.json();
      if(!response.ok||!data.id)throw new Error(data.error||"Envoi impossible.");
      if(current===sequence.current){onChange(`Logo : ${data.id}`,true);setFileName(file.name);}
    }catch(error){if(current===sequence.current)setError(error instanceof Error?error.message:"Envoi impossible.");}
    finally{if(current===sequence.current)setBusy(false);}
  }
  return <div className="space-y-3 rounded-2xl border border-sand p-4">
    <p className="text-sm font-bold">Personnalisation sous le motif NOS {priceCents>0?`(+ ${formatPrice(priceCents)})`:"(incluse)"}</p>
    <div className="grid grid-cols-3 gap-2">{[["none","Sans ajout"],["name","Mon prénom"],["logo","Mon logo"]].map(([key,label])=><button key={key} type="button" onClick={()=>choose(key)} aria-pressed={mode===key} className={`rounded-xl border px-2 py-3 text-sm font-semibold ${mode===key?"bg-ink text-white border-ink":"border-sand"}`}>{label}</button>)}</div>
    {mode==="name"&&<label className="block text-sm font-semibold">Prénom à inscrire<input value={value} onChange={e=>onChange(e.target.value,true)} maxLength={24} placeholder="Ex. Loïc" className="mt-2 w-full rounded-xl border border-sand p-3" /></label>}
    {mode==="logo"&&<div><label className="block text-sm font-semibold">Importer mon logo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>upload(e.target.files?.[0])} className="mt-2 block w-full text-sm" /></label><p className="mt-2 text-xs text-ink-soft">PNG transparent recommandé, JPEG ou WebP · 5 Mo maximum. Le fichier est transmis à l’atelier avec votre commande.</p>{fileName&&<p role="status" className="mt-2 text-sm">Logo reçu : {fileName}</p>}</div>}
    {busy&&<p role="status" className="text-sm">Envoi du logo…</p>}
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
  </div>;
}
