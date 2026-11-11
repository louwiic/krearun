"use client";
import { useRef, useState } from "react";
import { orderImageUrl, type OrderImageProduct } from "@/lib/order-images";
import { adminSearchText } from "@/lib/admin-search";
import OrderPhoto from "./OrderPhoto";
export default function OrderImagePicker({ initialImage = "", products }: { initialImage?: string; products: OrderImageProduct[] }) {
  const [image, setImage] = useState(initialImage);
  const [productId, setProductId] = useState(products.find(product => product.images.includes(initialImage))?.id ?? "");
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [onlyPhotos, setOnlyPhotos] = useState(false);
  const results = products.filter(item => (!onlyPhotos || item.images.length > 0) && adminSearchText(query).split(/\s+/).every(word => adminSearchText(item.name).includes(word)));
  const product = products.find(item => item.id === productId);
  return <div className="mb-5 rounded-xl border border-sand p-4">
    <h3 className="text-sm font-bold">Photo dans la liste des commandes</h3>
    <p className="mt-1 text-xs text-ink-soft">Choisissez un produit puis sa photo. La sélection sert de repère visuel ; renseignez les détails et le montant de la commande ci-dessous.</p>
    <div className="mt-3"><p className="text-sm font-semibold">Produit du catalogue</p>
      <button type="button" onClick={() => dialog.current?.showModal()} className="mt-2 flex w-full items-center justify-between gap-3 rounded-xl border border-sand bg-linen p-3 text-left text-sm"><span className="flex items-center gap-3"><OrderPhoto src={product?.images[0] ?? ""} name={product?.name ?? "Aucun produit"}/><span>{product?.name ?? "Choisir un produit du catalogue"}</span></span><span className="font-semibold text-terra">Rechercher →</span></button>
    </div>
    <dialog ref={dialog} aria-labelledby="catalog-picker-title" onClick={event => {if(event.target === event.currentTarget) dialog.current?.close();}} className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-full max-w-xl border-l border-sand bg-cream p-0 text-ink shadow-xl backdrop:bg-ink/40">
      <div className="flex h-full flex-col">
        <header className="shrink-0 border-b border-sand p-5">
          <div className="flex items-center justify-between gap-3"><h2 id="catalog-picker-title" className="font-display text-xl font-bold">Choisir un produit</h2><button type="button" onClick={() => dialog.current?.close()} aria-label="Fermer le catalogue" className="rounded-full border border-sand px-3 py-2">✕</button></div>
          <label className="mt-4 block text-sm font-semibold">Rechercher dans le catalogue<input autoFocus type="search" onKeyDown={event => {if(event.key === "Enter") event.preventDefault();}} value={query} onChange={event => setQuery(event.target.value)} placeholder="Nom du produit…" className="mt-2 w-full rounded-xl border border-sand bg-linen px-3 py-3 font-normal"/></label>
          <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyPhotos} onChange={event => setOnlyPhotos(event.target.checked)}/>Avec photo uniquement</label>
          <p role="status" className="mt-3 text-xs text-ink-soft">{results.length} produit{results.length > 1 ? "s" : ""}</p>
        </header>
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          <button type="button" onClick={()=>{setProductId("");setImage("");dialog.current?.close();}} className="w-full rounded-xl border border-sand p-3 text-left text-sm">Aucun produit / photo personnalisée</button>
          {results.map(item=><button key={item.id} type="button" aria-pressed={productId===item.id} onClick={()=>{setProductId(item.id);setImage(item.images[0] ?? "");dialog.current?.close();}} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm hover:bg-linen ${productId===item.id?"border-terra bg-terra/10":"border-sand"}`}><OrderPhoto src={item.images[0] ?? ""} name={item.name}/><span className="min-w-0 flex-1"><span className="block font-semibold">{item.name}</span><span className="text-xs text-ink-soft">{item.images.length ? `${item.images.length} photo(s)` : "Sans photo"}</span></span>{productId===item.id&&<span aria-label="Sélectionné">✓</span>}</button>)}
          {!results.length&&<p className="py-10 text-center text-sm text-ink-soft">Aucun produit trouvé. Essayez un autre nom.</p>}
        </div>
      </div>
    </dialog>
    {product && product.images.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{product.images.map((src, index) => <button key={src} type="button" onClick={() => setImage(src)} aria-label={`Choisir la photo ${index + 1} de ${product.name}`} aria-pressed={image === src} className={`rounded-xl ring-offset-2 ${image === src ? "ring-2 ring-terra" : "hover:ring-2 hover:ring-sand"}`}><OrderPhoto src={src} name={`${product.name} — photo ${index + 1}`} /></button>)}</div>}
    <div className="mt-4 flex items-center gap-3"><OrderPhoto src={orderImageUrl(image)} name="Aperçu de la photo de commande"/><label className="min-w-0 flex-1 text-xs font-semibold">Adresse de la photo (facultatif)<input name="productImage" value={image} onChange={event => setImage(event.target.value)} maxLength={2000} placeholder="https://… ou /products/…" className="mt-1.5 w-full rounded-xl border border-sand bg-linen px-3 py-2 text-sm font-normal" /></label></div>
    {image && <button type="button" onClick={() => {setImage("");setProductId("");}} className="mt-3 text-xs font-semibold underline">Retirer la photo choisie</button>}
  </div>;
}
