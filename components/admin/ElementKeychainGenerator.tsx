"use client";
import { useMemo, useState } from "react";
import { CLICKER_ELEMENTS, CLICKER_ELEMENT_GROUPS, clickerCharacters, clickerElement } from "@/lib/clicker-elements";
import { elementKeychainShapes } from "@/lib/element-keychain";
import { availableInventoryPalette, type ColorAvailability } from "@/lib/color-availability";
const field="mt-2 w-full rounded-xl border border-sand bg-white px-4 py-3 text-sm";
function contourPath(contours:number[][][]) { return contours.map(r=>`M${r.map(p=>p.join(",")).join("L")}Z`).join(" "); }
export default function ElementKeychainGenerator({inventory}:{inventory:ColorAvailability[]}) {
  const colors=useMemo(()=>availableInventoryPalette(inventory),[inventory]);
  const [elements,setElements]=useState<string[]>(["heart"]),[group,setGroup]=useState("Symboles"),[text,setText]=useState("");
  const [baseName,setBaseName]=useState(colors[0]?.name??""),[reliefName,setReliefName]=useState(colors[1]?.name??colors[0]?.name??"");
  const [border,setBorder]=useState(2.2),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const base=colors.find(c=>c.name===baseName),relief=colors.find(c=>c.name===reliefName);
  const configuration={elements,colors:{name:"Motifs",font:"chewy",style:"relief",borderWidthMm:border,baseColor:base?.hex,baseColorName:base?.name,textColor:relief?.hex,textColorName:relief?.name}};
  const result=useMemo(()=>{
    try { return {shapes:elementKeychainShapes({elements,colors:{name:"Motifs",font:"chewy",style:"relief",borderWidthMm:border,baseColor:base?.hex,baseColorName:base?.name,textColor:relief?.hex,textColorName:relief?.name}}),error:""}; }
    catch(e){return {shapes:null,error:e instanceof Error?e.message:"Composition invalide."};}
  },[elements,border,base,relief]);
  function add(id:string) { setElements(current=>current.length<8?[...current,id]:current);setError(""); }
  function addText() {
    const chars=clickerCharacters(text);const selected=chars.map(c=>clickerElement(c));
    if(!chars.length || selected.some(c=>!c)){setError("Ce texte contient un caractère absent du 3MF. Utilise la touche vierge pour un espace.");return;}
    if(elements.length+selected.length>8){setError("La composition peut contenir 8 éléments maximum.");return;}
    setElements(current=>[...current,...selected.map(c=>c!.id)]);setText("");setError("");
  }
  async function generate(format:"3mf"|"stl") {
    setBusy(true);setError("");
    try {
      const response=await fetch("/api/admin/keychains/elements",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({configuration,format})});
      if(!response.ok){const body=await response.json();throw new Error(body.error||"Génération impossible.");}
      const url=URL.createObjectURL(await response.blob()),a=document.createElement("a");a.href=url;a.download=`porte-cles-elements.${format==="3mf"?"3mf":"zip"}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch(e){setError(e instanceof Error?e.message:"Génération impossible.");}finally{setBusy(false);}
  }
  const shapes=result.shapes;
  return <section id="elements-3mf" className="mb-12 rounded-2xl border-2 border-sand bg-cream p-5 sm:p-7">
    <h2 className="font-display text-2xl font-bold">Porte-clés symboles et éléments du 3MF</h2>
    <p className="mt-2 text-sm text-ink-soft">Compose un porte-clé plat avec les motifs en relief du pack : symboles, lettres, chiffres, accents et touche vierge. Fond relié et trou latéral de 4 mm, comme pour les prénoms.</p>
    <div className="mt-6 grid gap-8 lg:grid-cols-2"><div>
      <label className="text-sm font-bold">Catalogue — {CLICKER_ELEMENTS.length} éléments<select value={group} onChange={e=>setGroup(e.target.value)} className={field}>{CLICKER_ELEMENT_GROUPS.map(g=><option key={g}>{g}</option>)}</select></label>
      <div className="mt-4 grid max-h-72 grid-cols-4 gap-2 overflow-y-auto pr-1 sm:grid-cols-6">{CLICKER_ELEMENTS.filter(e=>e.group===group).map(item=>{
        const [x,y,X,Y]=item.boundsMm;return <button type="button" key={item.id} title={`Ajouter : ${item.label}`} aria-label={`Ajouter : ${item.label}`} disabled={elements.length>=8} onClick={()=>add(item.id)} className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border border-sand bg-white p-2 text-center text-[10px] hover:border-terra disabled:opacity-40"><svg viewBox={`${x-1} ${y-1} ${X-x+2} ${Y-y+2}`} className="h-10 w-10" aria-hidden="true"><g transform={`translate(0 ${y+Y}) scale(1 -1)`}><path d={contourPath(item.contours)} fill="currentColor" fillRule="nonzero"/></g></svg><span>{item.label}</span></button>;
      })}</div>
      <label className="mt-5 block text-sm font-bold">Ajouter un texte du pack<input value={text} maxLength={8} onChange={e=>setText(e.target.value)} placeholder="Ex. NELL, 2026, ÉVA" className={field}/></label><button type="button" onClick={addText} className="mt-2 rounded-full border border-ink px-4 py-2 text-sm">Ajouter les caractères</button>
      <div className="mt-5 flex items-center justify-between"><h3 className="text-sm font-bold">Composition — {elements.length}/8</h3><button type="button" onClick={()=>setElements([])} className="text-sm underline">Tout effacer</button></div>
      <ol className="mt-3 flex flex-wrap gap-2">{elements.map((id,i)=><li key={`${id}-${i}`} className="rounded-xl border border-sand bg-white p-2 text-xs"><span>{i+1}. {CLICKER_ELEMENTS.find(e=>e.id===id)?.label}</span><div className="mt-1 flex gap-2"><button type="button" disabled={i===0} aria-label={`Déplacer l’élément ${i+1} à gauche`} onClick={()=>setElements(a=>{const b=[...a];[b[i-1],b[i]]=[b[i],b[i-1]];return b;})} className="disabled:opacity-30">←</button><button type="button" aria-label={`Retirer l’élément ${i+1}`} onClick={()=>setElements(a=>a.filter((_,j)=>j!==i))}>Retirer</button></div></li>)}</ol>
      <div className="mt-5 grid grid-cols-2 gap-3">{[["Fond",baseName,setBaseName],["Relief",reliefName,setReliefName]].map(([label,value,setter])=><label key={label as string} className="text-sm font-bold">{label as string}<select value={value as string} onChange={e=>(setter as (s:string)=>void)(e.target.value)} className={field}>{colors.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}</select></label>)}</div>
      <label className="mt-5 block text-sm font-bold">Contour du fond — {border.toFixed(1)} mm<input type="range" min="0.8" max="4" step="0.2" value={border} onChange={e=>setBorder(Number(e.target.value))} className="mt-3 w-full accent-terra"/></label>
    </div><div>
      <p className="text-sm font-bold">Aperçu de face</p>
      <div className="mt-3 flex min-h-64 items-center justify-center rounded-xl border border-sand bg-white p-4">{shapes?<svg viewBox={shapes.viewBox} role="img" aria-label="Porte-clés avec motifs et trou latéral" className="max-h-72 w-full"><g transform={`translate(0 ${shapes.previewFlipY}) scale(1 -1)`}><path d={shapes.basePath} fill={base?.hex} fillRule="nonzero"/><path d={shapes.lettersPath} fill={relief?.hex} fillRule="nonzero"/></g></svg>:<p role="status" className="text-center text-sm text-ink-soft">{result.error}</p>}</div>
      {shapes&&<p className="mt-3 text-sm">{shapes.width.toFixed(1)} × {shapes.height.toFixed(1)} × 3,6 mm · Fond 2,4 mm + relief 1,2 mm</p>}
      {(error||result.error)&&<p role="alert" className="mt-4 text-sm text-terra-deep">{error||result.error}</p>}
      <button type="button" disabled={!shapes||busy} onClick={()=>generate("3mf")} className="mt-6 w-full rounded-full bg-terra px-5 py-4 text-sm font-bold text-white disabled:opacity-40">{busy?"Génération…":"Télécharger le 3MF bicolore"}</button>
      <button type="button" disabled={!shapes||busy} onClick={()=>generate("stl")} className="mt-3 w-full rounded-full border border-ink px-5 py-3 text-sm font-bold disabled:opacity-40">Télécharger les STL</button>
    </div></div>
  </section>;
}
