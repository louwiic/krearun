"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { HolderConfiguration } from "@/lib/custom-holder";
const Preview=dynamic(()=>import('./HolderPreview3D'),{ssr:false});
export default function HolderAdminPreview({configuration,id}:{configuration:HolderConfiguration;id:string}) {
  const [open,setOpen]=useState(false);
  return <div><button type="button" onClick={()=>setOpen(!open)} className="rounded-full border border-sand px-4 py-2 text-sm font-bold">{open?'Fermer l’aperçu 3D':'Examiner en 3D'}</button>{open&&<div className="mt-4"><Preview configuration={configuration} logo={`/api/porte-boisson/demandes/${id}/logo`}/></div>}</div>;
}
