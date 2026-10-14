"use client";
import {useState} from 'react';
import type {HolderConfiguration} from '@/lib/custom-holder';
export default function HolderManufacturingExport({id,configuration}:{id:string;configuration:HolderConfiguration}) {
  const preset=configuration.model==='om'||configuration.model==='arsenal';
  const [depth,setDepth]=useState(.6),[clearance,setClearance]=useState(.2),[thickness,setThickness]=useState(1);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  async function download(){setBusy(true);setError('');setNotice('');try{
    const response=await fetch(`/api/porte-boisson/demandes/${id}/export`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({depth,clearance,thickness})});
    if(!response.ok){const data=await response.json();throw new Error(data.error||'Export impossible.');}
    const blob=await response.blob();const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`krearun-${id}.3mf`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    setNotice(decodeURIComponent(response.headers.get('X-Krearun-Export-Warnings')||'Export généré.'));
  }catch(error){setError(error instanceof Error?error.message:'Export impossible.');}finally{setBusy(false);}}
  return <section className="mt-5 rounded-xl border border-sand bg-linen p-4"><h3 className="text-sm font-bold">Fichier de fabrication 3MF</h3><p className="mt-2 text-xs leading-5 text-ink-soft">Corps avec logement et logo séparé à plat, avec ses couleurs. Un projet correspond à un porte-boisson.</p>
    {preset?<p className="mt-3 text-xs leading-5">OM / Arsenal : les logements, épaisseurs et placements du modèle d’origine sont conservés. Les couleurs et les gravures supplémentaires reprennent la demande.</p>:<fieldset disabled={busy} className="mt-4 grid grid-cols-3 gap-3 disabled:opacity-60">{[{label:'Creux (mm)',value:depth,set:setDepth,min:.2,max:1,step:.1},{label:'Jeu latéral (mm)',value:clearance,set:setClearance,min:.05,max:.35,step:.05},{label:'Logo (mm)',value:thickness,set:setThickness,min:.8,max:2,step:.2}].map(field=><label key={field.label} className="text-xs font-bold">{field.label}<input type="number" min={field.min} max={field.max} step={field.step} value={field.value} onChange={event=>field.set(Number(event.target.value))} className="mt-2 w-full rounded-lg border border-sand bg-white px-2 py-2 text-sm"/></label>)}</fieldset>}
    <button type="button" onClick={()=>void download()} disabled={busy} className="mt-4 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy?'Calcul du logement et du logo…':'Générer le 3MF de fabrication ↓'}</button>
    {busy&&<p role="status" className="mt-2 text-xs">Le calcul peut prendre jusqu’à deux minutes.</p>}{error&&<p role="alert" className="mt-3 text-sm text-terra-deep">{error}</p>}{notice&&<p role="status" className="mt-3 whitespace-pre-line text-xs leading-5">Téléchargement prêt. {notice}</p>}
  </section>;
}
