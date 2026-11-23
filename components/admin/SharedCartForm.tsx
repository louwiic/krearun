"use client";

import { useActionState, useRef, useState } from "react";
import { createSharedCart } from "@/app/admin/(dashboard)/paniers-a-partager/actions";
import { formatPrice } from "@/lib/format";
import { publicProductName } from "@/lib/public-copy";
import { quoteSharedCart, SHARED_CART_MAX_LINES } from "@/lib/shared-cart";
import type { Product } from "@/lib/types";

type Row = { id: number; kind: "catalog" | "custom"; productId: string; variantId: string; label: string; price: string; quantity: string; color: string; notes: string };
const field = "mt-1 block w-full rounded-xl border border-sand bg-white px-3 py-2 text-sm";
const emptyRow = (id: number): Row => ({ id, kind: "catalog", productId: "", variantId: "", label: "", price: "", quantity: "1", color: "", notes: "" });

export default function SharedCartForm({ products, requestId }: { products: Product[]; requestId: string }) {
  const nextId = useRef(1);
  const [rows, setRows] = useState([emptyRow(0)]);
  const [shipping, setShipping] = useState("");
  const [country, setCountry] = useState("RE");
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [state, action, pending] = useActionState(createSharedCart, {});
  const link = useRef<HTMLInputElement>(null);
  let total: number | undefined;
  try {
    const quote = quoteSharedCart(rows, products, shipping);
    total = quote.subtotalCents + quote.shippingCents;
  } catch { /* The total is available once the required fields are filled. */ }

  function update(id: number, patch: Partial<Row>) {
    setRows(current => current.map(row => row.id === id ? { ...row, ...patch } : row));
  }

  async function copy() {
    if (!state.url) return;
    try {
      await navigator.clipboard.writeText(state.url);
      setCopied(true);
    } catch {
      link.current?.select();
    }
  }

  if (state.url && state.expiresAt) return <section className="space-y-4 rounded-2xl border border-sand bg-cream p-5">
    <h2 className="text-xl font-semibold">Lien de paiement prêt</h2>
    <p>Total <strong>{formatPrice(state.totalCents ?? 0)}</strong>. Expire le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Indian/Reunion" }).format(state.expiresAt * 1000)} (heure de La Réunion).</p>
    <label className="block text-sm font-semibold">Lien à transmettre au client<input ref={link} readOnly className={field} value={state.url} /></label>
    <div className="flex flex-wrap items-center gap-4">
      <button type="button" className="rounded-full bg-ink px-5 py-2 text-sm font-bold text-cream" onClick={copy}>{copied ? "Lien copié" : "Copier le lien"}</button>
      <a href={state.url} target="_blank" rel="noreferrer" className="text-sm underline">Ouvrir le paiement ↗</a>
      <a href="/admin/paniers-a-partager" className="text-sm underline">Créer un autre panier</a>
    </div>
  </section>;

  return <form action={action} className="space-y-5">
    <input type="hidden" name="requestId" value={requestId} />
    <input type="hidden" name="rows" value={JSON.stringify(rows)} />
    <fieldset disabled={pending} className="space-y-4">
      {rows.map((row, index) => {
        const product = products.find(item => item.id === row.productId);
        const variants = product?.variants.filter(variant => variant.active) ?? [];
        return <fieldset key={row.id} className="grid gap-4 rounded-2xl border border-sand bg-cream p-4 sm:grid-cols-2">
          <legend className="px-2 text-sm font-bold">Article {index + 1}</legend>
          <label className="text-sm font-semibold">Type d’article
            <select value={row.kind} className={field} onChange={event => update(row.id, { kind: event.target.value === "custom" ? "custom" : "catalog" })}>
              <option value="catalog">Produit du catalogue</option><option value="custom">Création sur mesure</option>
            </select>
          </label>
          <label className="text-sm font-semibold">Quantité<input className={field} type="number" min="1" max="99" required value={row.quantity} onChange={event => update(row.id, { quantity: event.target.value })} /></label>
          {row.kind === "catalog" ? <>
            <label className="text-sm font-semibold">Produit
              <select required className={field} value={row.productId} onChange={event => update(row.id, { productId: event.target.value, variantId: "", color: "", notes: "" })}>
                <option value="">Choisir un produit</option>
                {products.map(item => <option key={item.id} value={item.id}>{publicProductName(item.slug, item.name)} · {formatPrice(item.priceCents)}{item.privateSale ? " · Offre privée" : ""}</option>)}
              </select>
            </label>
            {variants.length > 0 && <label className="text-sm font-semibold">Variante
              <select required className={field} value={row.variantId} onChange={event => update(row.id, { variantId: event.target.value })}>
                <option value="">Choisir une variante</option>
                {variants.map(variant => <option key={variant.id} value={variant.id}>{variant.name} · {formatPrice(variant.priceCents || product!.priceCents)}</option>)}
              </select>
            </label>}
          </> : <>
            <label className="text-sm font-semibold">Nom de la création<input required className={field} maxLength={120} value={row.label} onChange={event => update(row.id, { label: event.target.value })} /></label>
            <label className="text-sm font-semibold">Prix unitaire (€)<input required className={field} type="number" min="0.01" step="0.01" value={row.price} onChange={event => update(row.id, { price: event.target.value })} /></label>
          </>}
          <label className="text-sm font-semibold">Coloris (facultatif)<input className={field} maxLength={80} value={row.color} onChange={event => update(row.id, { color: event.target.value })} /></label>
          <label className="text-sm font-semibold sm:col-span-2">Prénom, personnalisation ou détails convenus (facultatif)<textarea className={field} rows={2} maxLength={300} value={row.notes} onChange={event => update(row.id, { notes: event.target.value })} /></label>
          {rows.length > 1 && <button type="button" onClick={() => setRows(current => current.filter(item => item.id !== row.id))} className="justify-self-start text-sm underline">Retirer l’article {index + 1}</button>}
        </fieldset>;
      })}
      <button type="button" disabled={rows.length >= SHARED_CART_MAX_LINES} onClick={() => setRows([...rows, emptyRow(nextId.current++)])} className="rounded-full border border-sand px-4 py-2 text-sm font-bold disabled:opacity-50">+ Ajouter un article</button>
      <div className="grid gap-4 rounded-2xl border border-sand bg-cream p-4 sm:grid-cols-3">
        <label className="text-sm font-semibold">Destination<select name="country" className={field} value={country} onChange={event => setCountry(event.target.value)}><option value="RE">La Réunion</option><option value="FR">France métropolitaine</option></select></label>
        <label className="text-sm font-semibold">Frais de livraison (€)<input className={field} name="shipping" type="number" required min="0" max="1000" step="0.01" placeholder="0 si offert" value={shipping} onChange={event => setShipping(event.target.value)} /></label>
        <label className="text-sm font-semibold">E-mail client (facultatif)<input className={field} name="email" type="email" maxLength={254} value={email} onChange={event => setEmail(event.target.value)} /></label>
      </div>
      {total !== undefined && <p>Total avec livraison <strong>{formatPrice(total)}</strong></p>}
      {state.error && <p role="alert" className="text-sm font-semibold text-rose-800">{state.error}</p>}
      <button type="submit" className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-cream disabled:opacity-50">{pending ? "Création du lien…" : "Créer le lien de paiement"}</button>
    </fieldset>
  </form>;
}
