/* eslint-disable @next/next/no-img-element -- Original customer-supplied style photos. */
"use client";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KEYCHAIN_FONTS, KEYCHAIN_ID, KEYCHAIN_PRODUCT, KEYCHAIN_PRICE_CENTS, keychainLabel, parseKeychainConfiguration } from "@/lib/name-keychain";
import { availableInventoryPalette, type ColorAvailability } from "@/lib/color-availability";
import { colorSwatchStyle } from "@/lib/color-swatches";
import { useCart } from "@/components/cart/CartContext";
const Preview=dynamic(()=>import("./KeychainPreview"),{ssr:false,loading:()=> <div className="grid min-h-72 place-items-center rounded-2xl bg-cream text-sm">Préparation de l’aperçu…</div>});
export default function KeychainConfigurator({inventory,admin=false}:{inventory:ColorAvailability[];admin?:boolean}){
  const colors=useMemo(()=>availableInventoryPalette(inventory),[inventory]);
  const [name,setName]=useState("Léa"),[font,setFont]=useState("chewy"),[style,setStyle]=useState("relief");
  const [borderWidthMm,setBorderWidthMm]=useState<number|undefined>();
  const [baseName,setBaseName]=useState(colors[0]?.name||""),[textName,setTextName]=useState(colors[1]?.name||colors[0]?.name||"");
  const [ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[fileUrl,setFileUrl]=useState("");
  const {addItem}=useCart();const router=useRouter();
  const result=useMemo(()=>{
    const base=colors.find(c=>c.name===baseName),text=colors.find(c=>c.name===(style==="mono"?baseName:textName));
    try{return {configuration:parseKeychainConfiguration({name,font,style,borderWidthMm,baseColor:base?.hex,baseColorName:base?.name,textColor:text?.hex,textColorName:text?.name}),error:""};}
    catch(error){return {configuration:null,error:error instanceof Error?error.message:"Vérifiez les options."};}
  },[name,font,style,borderWidthMm,baseName,textName,colors]);
  async function generate(format:"3mf"|"stl"){
    if(!result.configuration)return;setBusy(true);setError("");setFileUrl("");
    try{
      const response=await fetch(format==="3mf"?"/api/admin/keychains":"/api/admin/keychains/export",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({configuration:result.configuration})});
      if(!response.ok){const body=await response.json();throw new Error(body.error||"Génération impossible.");}
      if(format==="3mf"){const body=await response.json();setFileUrl(body.url);router.refresh();}
      else {const url=URL.createObjectURL(await response.blob());const anchor=document.createElement("a");anchor.href=url;anchor.download="porte-cles-prenom-stl.zip";anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
    }catch(error){setError(error instanceof Error?error.message:"Génération impossible.");}finally{setBusy(false);}
  }
  function palette(part:"base"|"text"){
    const selected=part==="base"?baseName:textName;
    return <fieldset className="mt-6"><legend className="text-sm font-bold">{part==="base"?(style==="mono"?"Couleur du porte-clés":"Couleur du fond"):"Couleur du prénom"} — {selected}</legend><div className="mt-3 flex flex-wrap gap-3">{colors.map(color=><button key={color.name} type="button" aria-label={color.name} aria-pressed={selected===color.name} title={color.name} onClick={()=>{if(part==="base")setBaseName(color.name);else setTextName(color.name);}} className={`h-10 w-10 rounded-full border-2 focus-visible:outline-2 focus-visible:outline-offset-4 ${selected===color.name?"scale-110 border-terra ring-2 ring-terra/30":"border-sand"}`} style={colorSwatchStyle(color)}/>)}</div></fieldset>;
  }
  return <div className="grid gap-8 lg:grid-cols-2 lg:gap-12"><div>
    {result.configuration?<Preview configuration={result.configuration} onValidity={setReady}/>:<div className="grid min-h-72 place-items-center rounded-2xl bg-cream p-5 text-center text-sm">{result.error}</div>}
    <div className="mt-5 grid grid-cols-3 gap-3">{["relief","script","block"].map((example,index)=><button type="button" key={example} onClick={()=>{setStyle(index===0?"relief":"mono");setFont(index===1?"pacifico":index===2?"lilita":"chewy");}} className="overflow-hidden rounded-xl border border-sand text-left">
      <img src={`/keychains/${example}-reference.png`} alt={index===0?"Exemple de relief bicolore":index===1?"Exemple d’écriture cursive":"Exemple de lettres épaisses"} className="aspect-square w-full object-cover"/><span className="block p-2 text-xs font-bold">{["Relief bicolore","Écriture cursive","Lettres épaisses"][index]}</span></button>)}</div><p className="mt-2 text-xs text-ink-soft">Photos d’inspiration : créez votre modèle dans l’aperçu ci-dessus.</p>
  </div><div>
    <p className="font-display text-3xl font-bold">12 € <span className="text-sm font-normal text-ink-soft">livraison incluse</span></p>
    <label className="mt-6 block text-sm font-bold">Votre prénom<input value={name} maxLength={18} onChange={event=>setName(event.target.value)} className="mt-2 w-full rounded-xl border border-sand bg-white px-4 py-3 text-base" placeholder="Ex. Léa"/><span className="mt-2 block text-xs font-normal text-ink-soft">18 caractères maximum. Respectez les majuscules souhaitées.</span></label>
    <fieldset className="mt-6"><legend className="text-sm font-bold">Modèle</legend><div className="mt-3 grid grid-cols-2 gap-3">{[["relief","Relief bicolore"],["mono","Lettres unies"]].map(([id,label])=><button type="button" aria-pressed={style===id} key={id} onClick={()=>setStyle(id)} className={`rounded-xl border-2 p-3 text-sm font-bold ${style===id?"border-ink bg-cream":"border-sand"}`}>{label}</button>)}</div></fieldset>
    <label className="mt-6 block text-sm font-bold">Police<select value={font} onChange={event=>setFont(event.target.value)} className="mt-2 w-full rounded-xl border border-sand bg-white px-4 py-3">{KEYCHAIN_FONTS.map(item=><option key={item.id} value={item.id}>{item.label} — {item.description}</option>)}</select></label>
    <label className="mt-6 block text-sm font-bold">Largeur du fond — {(borderWidthMm ?? (style==="relief"?2.2:0.8)).toFixed(1).replace(".",",")} mm
      <input type="range" min="0.8" max="4" step="0.2" value={borderWidthMm ?? (style==="relief"?2.2:0.8)} onChange={event=>setBorderWidthMm(Number(event.target.value))} className="mt-3 block w-full accent-terra"/>
      <span className="mt-2 block text-xs font-normal text-ink-soft">Élargissez le contour autour du prénom pour un fond plus généreux. L’œillet reste renforcé et son trou conserve un diamètre de 4 mm.</span>
    </label>
    {palette("base")}{style==="relief"&&palette("text")}
    {!colors.length&&<p className="mt-5 text-sm text-terra-deep">Aucun coloris disponible à l’atelier pour le moment.</p>}
    <p className="mt-6 text-sm text-ink-soft">Anneau inclus · fabriqué à La Réunion · prêt en 2 à 4 jours de préparation</p>
    {result.error&&<p role="alert" className="mt-4 text-sm text-terra-deep">{result.error}</p>}{error&&<p role="alert" className="mt-4 text-sm text-terra-deep">{error}</p>}
    {admin?<><button type="button" disabled={!result.configuration||!ready||busy} onClick={()=>generate("3mf")} className="mt-6 w-full rounded-full bg-terra px-5 py-4 text-sm font-bold text-white disabled:opacity-50">{busy?"Génération…":"Générer et enregistrer le 3MF"}</button><button type="button" disabled={!result.configuration||!ready||busy} onClick={()=>generate("stl")} className="mt-3 w-full rounded-full border border-ink px-5 py-3 text-sm font-bold disabled:opacity-50">Télécharger les STL séparés</button>{fileUrl&&<a href={fileUrl} className="mt-4 inline-block font-bold text-terra underline">Télécharger le 3MF enregistré</a>}</>:<button type="button" disabled={!result.configuration||!ready} onClick={()=>{
      const config=result.configuration;if(!config)return;
      addItem({productId:KEYCHAIN_ID,slug:KEYCHAIN_PRODUCT.slug,name:KEYCHAIN_PRODUCT.name,priceCents:KEYCHAIN_PRICE_CENTS,color:`${config.baseColorName} / ${config.textColorName}`,customName:keychainLabel(config),keychainConfiguration:config,image:KEYCHAIN_PRODUCT.images[0],stock:999,weightGrams:30,quantityDiscounts:[]});
    }} className="mt-6 w-full rounded-full bg-terra px-5 py-4 text-sm font-bold text-white transition-colors hover:bg-terra-deep disabled:opacity-50">Ajouter au panier — 12 €</button>}
  </div></div>;
}
