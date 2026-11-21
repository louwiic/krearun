"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { formatPrice } from "@/lib/format";
import { COFFRET_CATALOGUE as catalogue, COFFRET_MODELS, COFFRET_COLORS, COFFRET_TARIFFS, COFFRET_ID, COFFRET_SLUG, coffretConfiguration, coffretLineId, coffretDetails, coffretImage, coffretLabel, coffretQuote, type CoffretSize, type CoffretModel, type CoffretFont, type CoffretConfiguration } from "@/lib/coffrets";
import CoffretLivePreview, { CoffretFontSample, type CoffretView } from "./CoffretLivePreview";
import { COFFRET_FONTS } from "@/lib/coffret-lettering";
import styles from "./coffrets.module.css";

export default function CoffretConfigurator() {
  const { addItem } = useCart();
  const [formule,setFormule] = useState<CoffretConfiguration["formule"]>("coffret_avec_poissons");
  const [format,setFormat] = useState<CoffretSize>("petit");
  const [modele,setModele] = useState<CoffretModel>("Coco");
  const [couleur,setCouleur] = useState("bleu");
  const [police,setPolice] = useState<CoffretFont>("F2");
  const [quantity,setQuantity] = useState("1");
  const [view,setView] = useState<CoffretView>("open");
  const [message,setMessage] = useState("");
  const c = coffretConfiguration({formule,format,modele,couleur,police});
  const fish = formule === "poissons_seuls";
  const q = Number(quantity);
  const validQuantity = Number.isInteger(q) && q >= 1 && q <= 20;
  const price = COFFRET_TARIFFS[format][formule];
  let orderable = false;
  try { coffretQuote(c,q); orderable = true; } catch { /* Missing commercial data keeps purchase unavailable. */ }
  const chosenColor = COFFRET_COLORS.find(v => v.name === couleur)!;
  function add() {
    try {
      const quote = coffretQuote(c,q);
      addItem({productId:COFFRET_ID,slug:COFFRET_SLUG,name:coffretLabel(c),priceCents:quote.priceCents,color:c.couleur || "",variantId:coffretLineId(c),image:coffretImage(c),stock:20,weightGrams:quote.weightGrams,coffretConfiguration:c},q);
      setMessage("Votre configuration a été ajoutée au panier.");
    } catch(e) { setMessage(e instanceof Error ? e.message : "Vérifiez les options."); }
  }
  return <div className={styles.configurator}>
    <header className={styles.heading}><p>LA RÉUNION, À EMPORTER</p><h1>Un petit écrin.<br/>Un grand air péi.</h1><div>Huit décors tropicaux, vos couleurs et deux poissons pour garder vos bijoux ensemble.</div></header>
    {!fish&&<aside className={styles.mobilePreview} aria-label="Votre coffret en direct"><CoffretLivePreview model={modele} font={police} color={couleur} view={view}/><div><strong>{modele} · {couleur}</strong><span>{police} · {catalogue.polices[police]}</span><select aria-label="Vue du coffret" value={view} onChange={e=>setView(e.target.value as CoffretView)}><option value="open">Ouvert</option><option value="closed">Fermé · perspective</option><option value="detail">Zoom couvercle</option></select></div></aside>}
    <div className={styles.layout}>
      <section className={styles.gallery} aria-label="Aperçu du coffret">
        <div className={styles.preview}>
          <span className={styles.badge}>{fish ? "Les supports à bijoux" : `Collection tropicale · ${modele}`}</span>
          {fish ? <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/coffrets/reference/coffret.webp" alt="Les deux supports à bijoux dans le coffret de référence" width="1455" height="1081"/></> : <CoffretLivePreview model={modele} font={police} color={couleur} view={view}/>}
        </div>
        {!fish && <div className={styles.tabs}><button type="button" aria-pressed={view==="open"} onClick={()=>setView("open")}>Coffret ouvert</button><button type="button" aria-pressed={view==="closed"} onClick={()=>setView("closed")}>Coffret fermé</button><button type="button" aria-pressed={view==="detail"} onClick={()=>setView("detail")}>Détail du décor</button></div>}
        <p className={styles.caption}>{fish ? "L’ensemble seul comprend les deux supports. La boîte et les bijoux de la photo sont exclus." : "Motif, couleur et police s’affichent en direct. Visuel de présentation ; bijoux non inclus."}</p>
        <div className={styles.features}><div><strong>Deux formats</strong><span>Un écrin pour chaque escapade</span></div><div><strong>Deux supports</strong><span>Boucles, colliers et bracelets</span></div><div><strong>Huit motifs péi</strong><span>Les illustrations de la collection</span></div></div>
      </section>
      <section className={styles.options} aria-label="Configurer votre coffret">
        <div className={styles.intro}><p>COFFRETS À BIJOUX</p><h2>Composez votre écrin</h2><span>Première collection · modèle de référence</span></div>
        <fieldset><legend>Votre formule</legend><div className={styles.two}>{catalogue.formules.map(f=><button type="button" key={f} aria-pressed={formule===f} onClick={()=>{setFormule(f as typeof formule);setView("open");}}>{f === "poissons_seuls" ? "Ensemble de poissons seul" : "Coffret + ensemble de poissons"}</button>)}</div></fieldset>
        <fieldset><legend>{fish ? "Format de compatibilité" : "Le format"}</legend><div className={styles.two}>{(["petit","grand"] as const).map(size=><button type="button" key={size} aria-pressed={format===size} onClick={()=>setFormat(size)}><strong>{size === "petit" ? "Petit" : "Grand"}</strong><span>{catalogue.formats_mm[size].map(mm=>(mm/10).toFixed(1).replace(".",",")).join(" × ")} cm</span></button>)}</div><p className={styles.note}>L × l × H du coffret. Dimensions indicatives, à confirmer après prototype.</p></fieldset>
        {!fish && <>
          <fieldset><legend>Votre motif <span>{modele}</span></legend><div className={styles.models}>{COFFRET_MODELS.map(m=><button type="button" key={m} aria-pressed={modele===m} onClick={()=>{setModele(m);}}><span aria-hidden="true" className={styles.modelPreview}><CoffretLivePreview model={m} font={police} color={couleur}/></span><span>{m === "Girl-box" ? "Girl box" : m}</span></button>)}</div></fieldset>
          <fieldset><legend>Couleur du corps <span>{couleur}</span></legend><div className={styles.colors}>{COFFRET_COLORS.map(color=><button type="button" key={color.name} aria-label={`Couleur ${color.name}`} aria-pressed={couleur===color.name} onClick={()=>{setCouleur(color.name);}}><i style={{background:color.hex}}/><span>{color.name}</span></button>)}</div><p className={styles.note}>Teintes à l’écran indicatives. Rose et Pink2 : deux nuances distinctes, échantillons réels à confirmer.</p></fieldset>
          <fieldset className={styles.fontPicker}><legend>La police <span>{police} · {catalogue.polices[police]}</span></legend><div className={styles.liveFontPreview}><CoffretLivePreview model={modele} font={police} color={couleur} view={view==="closed"?"closed":"detail"}/><span aria-live="polite">{police} · {catalogue.polices[police]} — aperçu en direct</span></div><div className={styles.fonts}>{COFFRET_FONTS.map(font=><button type="button" key={font.code} aria-label={`${font.code} ${font.name}`} aria-pressed={font.code===police} onClick={()=>setPolice(font.code as CoffretFont)}><span className={styles.fontLabel}>{font.code} · {font.name}</span><CoffretFontSample model={modele} font={font.code as CoffretFont}/>{font.name!==font.original && <span className={styles.fontAlternative}>Alternative à {font.original}</span>}</button>)}</div><p className={styles.note}>Choisissez une police pour voir immédiatement le titre et la phrase sur votre boîte.</p></fieldset>
        </>}
        <div className={styles.summary} style={{borderTopColor:fish ? "#145b63" : chosenColor.hex}}><h3>Votre sélection</h3><dl>{coffretDetails(c).map(d=><div key={d.label}><dt>{d.label}</dt><dd>{d.value}</dd></div>)}</dl></div>
        <div className={styles.purchase}><label htmlFor="coffret-quantity">Quantité<input id="coffret-quantity" type="number" min="1" max="20" step="1" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label><div aria-live="polite"><strong>{price && validQuantity ? formatPrice(price*q) : "Tarif à venir"}</strong><span>{price ? `${formatPrice(price)} par ensemble` : "Les tarifs Kréarun seront annoncés prochainement."}</span></div></div>
        {!validQuantity && <p role="alert">Choisissez une quantité entière de 1 à 20.</p>}
        <button className={styles.add} type="button" disabled={!orderable} onClick={add}>{orderable ? "Ajouter au panier" : "Bientôt disponible"}</button>
        <p role="status" className={styles.note}>{message || (orderable ? "Prix du coffret complet avec ses deux supports à bijoux, hors livraison." : "Le tarif de cette formule sera annoncé prochainement.")}</p>
      </section>
    </div>
  </div>;
}
