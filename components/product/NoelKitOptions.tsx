"use client";
import type { Product, ProductVariant } from "@/lib/types";
import { noelKitCount, noelKitVariants } from "@/lib/noel-kits";
import { formatPrice } from "@/lib/format";

export default function NoelKitOptions({product,selected,onSelect}:{product:Product;selected?:ProductVariant;onSelect:(variant:ProductVariant)=>void}) {
  const kits = noelKitVariants(product);
  const ready = product.variants.find(v=>v.active && noelKitCount(product.slug,v.id) === null);
  const selectedCount = noelKitCount(product.slug,selected?.id);
  const first = kits[0];
  if (!first) return null;
  return <div className="space-y-4">
    <fieldset><legend className="mb-2 text-sm font-bold">Choisissez votre formule</legend><div className="grid gap-2 sm:grid-cols-2">
      {ready && <button type="button" aria-pressed={!selectedCount} onClick={()=>onSelect(ready)} className={`rounded-xl border-2 p-3 text-left ${!selectedCount ? "border-ink bg-cream" : "border-sand"}`}><span className="block font-bold">Déjà thermoformée</span><span className="mt-1 block text-sm">{formatPrice(ready.priceCents)} · une décoration prête à installer</span></button>}
      <button type="button" aria-pressed={Boolean(selectedCount)} onClick={()=>onSelect(selectedCount ? selected! : first)} className={`rounded-xl border-2 p-3 text-left ${selectedCount ? "border-ink bg-cream" : "border-sand"}`}><span className="block font-bold">Kit à fabriquer</span><span className="mt-1 block text-sm">Dès {formatPrice(first.priceCents)} · un jeu de moules inclus</span></button>
    </div></fieldset>
    {selectedCount && selected ? <div className="rounded-xl border border-terra/30 bg-cream p-4">
      <label className="block font-bold" htmlFor={`kit-count-${product.id}`}>Nombre de décorations à thermoformer</label>
      <select id={`kit-count-${product.id}`} value={selected.id} onChange={event=>{const variant=kits.find(v=>v.id===event.target.value);if(variant)onSelect(variant);}} className="mt-2 w-full min-w-0 rounded-xl border border-sand bg-white px-3 py-3 text-base">
        {kits.map(v=>{const n=noelKitCount(product.slug,v.id)!;return <option key={v.id} value={v.id} disabled={!product.preorder && v.stock<=0}>{n} décoration{n>1?"s":""} · {formatPrice(v.priceCents)}{!product.preorder && v.stock<=0?" · indisponible":""}</option>;})}
      </select>
      <p className="mt-3 text-sm leading-6">{selectedCount} décoration{selectedCount>1?"s":""} du même motif : pièces plates, connecteurs et cordon pour chacune, avec <strong>un seul jeu de moules réutilisables</strong> pour tout le kit. Sèche-cheveux non fourni.</p>
      <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-sand pt-3"><strong>Total du kit : {formatPrice(selected.priceCents)}</strong><span className="text-sm">Soit {formatPrice(Math.round(selected.priceCents/selectedCount))} par décoration, moules compris</span></div>
      {kits.length>1 && <div className="mt-3"><p className="text-sm font-bold">Prix dégressif selon le nombre de pièces</p><div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">{kits.filter(v=>[1,3,5,10].includes(noelKitCount(product.slug,v.id)!)).map(v=>{const n=noelKitCount(product.slug,v.id)!;return <button key={v.id} type="button" onClick={()=>onSelect(v)} disabled={!product.preorder && v.stock<=0} aria-label={`Choisir ${n} décorations`} className="rounded-lg border border-sand bg-white p-2 text-left disabled:opacity-40"><span className="block font-bold">{n} pièce{n>1?"s":""}</span><span className="block">{formatPrice(v.priceCents)}</span><span className="block text-xs text-ink-soft">≈ {formatPrice(Math.round(v.priceCents/n))}/pièce</span></button>;})}</div><p className="mt-2 text-xs leading-5 text-ink-soft">Le jeu de moules est compté une seule fois. Une réduction supplémentaire s’applique aux pièces ajoutées dès 3, 5 et 10 décorations.</p></div>}
    </div> : null}
  </div>;
}
