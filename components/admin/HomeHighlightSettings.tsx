"use client";
import {useActionState,useState} from "react";
import {saveHomeHighlightAction} from "@/app/admin/actions";
import type {HomeHighlight} from "@/lib/home-highlight";
const field="mt-2 w-full rounded-xl border border-sand bg-linen px-3 py-3 text-sm font-normal";
export default function HomeHighlightSettings({config,products}:{config:HomeHighlight;products:{slug:string;name:string;active:boolean}[]}) {
 const [state,action,pending]=useActionState(saveHomeHighlightAction,{});
 const [source,setSource]=useState(config.mediaSource);
 const [query,setQuery]=useState("");
 const [slug,setSlug]=useState(config.productSlug);
 const results=products.filter(p=>p.slug===slug||p.name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().includes(query.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()));
 return <section id="home-highlight-settings" className="mb-6 rounded-blob bg-cream p-7 shadow-soft">
  <h2 className="font-display text-xl font-semibold">Accueil — À ne pas rater</h2>
  <p className="mt-2 text-sm text-ink-soft">Bloc placé juste avant « Votre sélection ». Texte à gauche, vidéo ou photo à droite. Avec les deux médias, la petite photo apparaît à gauche de la vidéo.</p>
  <form action={action} className="mt-5 grid gap-4">
   <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="enabled" defaultChecked={config.enabled}/>Afficher ce bloc sur l’accueil</label>
   <label className="text-sm font-semibold">Rechercher un produit<input type="search" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")e.preventDefault();}} placeholder="Nom du produit…" className={field}/></label>
   <label className="text-sm font-semibold">Produit mis en avant<select name="productSlug" value={slug} onChange={e=>setSlug(e.target.value)} className={field}><option value="">Choisir un produit</option>{results.map(p=><option key={p.slug} value={p.slug}>{p.name}{p.active?"":" — masqué"}</option>)}</select></label>
   <label className="text-sm font-semibold">Titre du bloc<input name="heading" maxLength={100} defaultValue={config.heading} className={field}/></label>
   <label className="text-sm font-semibold">Description<textarea name="description" rows={4} maxLength={1000} defaultValue={config.description} className={field} placeholder="Vide : reprend l’accroche du produit"/></label>
   <label className="text-sm font-semibold">Texte du bouton<input name="cta" maxLength={60} defaultValue={config.cta} className={field}/></label>
   <label className="text-sm font-semibold">Médias affichés<select name="mediaMode" defaultValue={config.mediaMode} className={field}><option value="both">Photo + vidéo</option><option value="image">Photo uniquement</option><option value="video">Vidéo uniquement</option></select></label>
   <label className="text-sm font-semibold">Origine des médias<select name="mediaSource" value={source} onChange={e=>setSource(e.target.value as HomeHighlight["mediaSource"])} className={field}><option value="product">Reprendre la photo et la vidéo de la fiche produit</option><option value="custom">Utiliser des médias spécifiques à ce bloc</option></select></label>
   <div hidden={source!=="custom"} className="space-y-4 rounded-xl border border-sand p-4">
    <p className="text-xs text-ink-soft">Ces médias restent propres à ce bloc. Pour changer les médias avec le produit, choisissez « Reprendre la photo et la vidéo de la fiche produit ».</p>
    <label className="block text-sm font-semibold">URL de la photo<input name="image" maxLength={2000} defaultValue={config.image} className={field}/></label>
    <label className="block text-sm font-semibold">Importer une photo (JPEG, PNG, WebP)<input type="file" name="image_file" accept="image/jpeg,image/png,image/webp" className={field}/></label>
    <label className="block text-sm font-semibold">URL de la vidéo<input name="video" maxLength={2000} defaultValue={config.video} className={field}/></label>
    <label className="block text-sm font-semibold">Importer une vidéo (MP4, WebM, MOV)<input type="file" name="video_file" accept="video/mp4,video/webm,video/quicktime" className={field}/></label>
    <p className="text-xs text-ink-soft">5 Mo par fichier, 5 Mo au total par envoi. Pour un fichier plus lourd, utilisez son URL. Effacez une URL pour retirer le média correspondant.</p>
   </div>
   <p className="text-xs text-ink-soft">Le prix, la livraison et le lien du bouton suivent automatiquement le produit. Un produit masqué n’apparaît pas dans ce bloc.</p>
   <button disabled={pending} className="justify-self-start rounded-full bg-ink px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{pending?"Enregistrement…":"Enregistrer le bloc"}</button>
   {state.error&&<p role="alert" className="text-sm text-red-700">{state.error}</p>}{state.success&&<p role="status" className="text-sm text-green-800">{state.success}</p>}
  </form>
 </section>;
}
