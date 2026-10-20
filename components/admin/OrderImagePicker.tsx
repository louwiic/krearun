"use client";
import { useState } from "react";
import { orderImageUrl, type OrderImageProduct } from "@/lib/order-images";
import OrderPhoto from "./OrderPhoto";
export default function OrderImagePicker({ initialImage = "", products }: { initialImage?: string; products: OrderImageProduct[] }) {
  const [image, setImage] = useState(initialImage);
  const [productId, setProductId] = useState(products.find(product => product.images.includes(initialImage))?.id ?? "");
  const product = products.find(item => item.id === productId);
  return <div className="mb-5 rounded-xl border border-sand p-4">
    <h3 className="text-sm font-bold">Photo dans la liste des commandes</h3>
    <p className="mt-1 text-xs text-ink-soft">Choisissez un produit puis sa photo. La sélection sert de repère visuel ; renseignez les détails et le montant de la commande ci-dessous.</p>
    <label className="mt-3 block text-sm font-semibold">Produit du catalogue
      <select value={productId} onChange={event => { setProductId(event.target.value); setImage(products.find(item => item.id === event.target.value)?.images[0] ?? ""); }} className="mt-1.5 w-full rounded-xl border border-sand bg-linen px-3 py-3 text-sm">
        <option value="">Aucun / photo personnalisée</option>
        {products.map(item => <option key={item.id} value={item.id}>{item.name}{item.images.length ? "" : " — sans photo"}</option>)}
      </select>
    </label>
    {product && product.images.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{product.images.map((src, index) => <button key={src} type="button" onClick={() => setImage(src)} aria-label={`Choisir la photo ${index + 1} de ${product.name}`} aria-pressed={image === src} className={`rounded-xl ring-offset-2 ${image === src ? "ring-2 ring-terra" : "hover:ring-2 hover:ring-sand"}`}><OrderPhoto src={src} name={`${product.name} — photo ${index + 1}`} /></button>)}</div>}
    <div className="mt-4 flex items-center gap-3"><OrderPhoto src={orderImageUrl(image)} name="Aperçu de la photo de commande"/><label className="min-w-0 flex-1 text-xs font-semibold">Adresse de la photo (facultatif)<input name="productImage" value={image} onChange={event => setImage(event.target.value)} maxLength={2000} placeholder="https://… ou /products/…" className="mt-1.5 w-full rounded-xl border border-sand bg-linen px-3 py-2 text-sm font-normal" /></label></div>
    {image && <button type="button" onClick={() => {setImage("");setProductId("");}} className="mt-3 text-xs font-semibold underline">Retirer la photo choisie</button>}
  </div>;
}
