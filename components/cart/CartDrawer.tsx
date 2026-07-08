"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "./CartContext";
import { formatPrice } from "@/lib/format";
import { calculateShippingCents, formatWeight, parseShippingRates } from "@/lib/shipping";

export default function CartDrawer({
  freeShippingThresholdCents,
  shippingRatesJson,
}: {
  freeShippingThresholdCents: number;
  shippingRatesJson: string;
}) {
  const { items, subtotalCents, totalWeightGrams, isOpen, closeCart, setQuantity, removeItem } =
    useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const freeShippingEnabled = freeShippingThresholdCents > 0;
  const remaining = freeShippingThresholdCents - subtotalCents;
  const shippingRates = parseShippingRates(shippingRatesJson);
  const shippingEstimate = calculateShippingCents(totalWeightGrams || 1, shippingRates);
  const freeShipping = freeShippingEnabled && subtotalCents >= freeShippingThresholdCents;
  const shippingCents = freeShipping ? 0 : shippingEstimate.priceCents;
  const totalCents = subtotalCents + shippingCents;

  async function checkout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            color: i.color,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Une erreur est survenue");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue");
      setLoading(false);
    }
  }

  return (
    <>
      {/* Voile */}
      <div
        onClick={closeCart}
        className={`fixed inset-0 z-50 bg-ink/25 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* Tiroir */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-linen shadow-lifted transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-sand/70 px-6 py-5">
          <h2 className="font-display text-xl font-semibold">Votre panier</h2>
          <button
            onClick={closeCart}
            aria-label="Fermer le panier"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-linen-deep"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linen-deep text-3xl">
              ☁️
            </div>
            <p className="font-display text-lg">Votre panier fait la sieste</p>
            <p className="text-sm text-ink-soft">
              Remplissez-le de petites choses douces.
            </p>
            <Link
              href="/boutique"
              onClick={closeCart}
              className="mt-2 rounded-full bg-terra px-6 py-3 text-sm font-bold text-cream transition-colors hover:bg-terra-deep"
            >
              Découvrir la boutique
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-sand/70 bg-cream px-6 py-3 text-center text-xs font-semibold text-ink-soft">
              {freeShippingEnabled && remaining > 0 ? (
                <>
                  Plus que <span className="text-terra">{formatPrice(remaining)}</span>{" "}
                  pour la livraison offerte ✿
                </>
              ) : freeShippingEnabled ? (
                <>La livraison est offerte pour vous ✿</>
              ) : (
                <>Livraison Colissimo calculée par poids ✿</>
              )}
            </div>

            <ul className="soft-scroll flex-1 divide-y divide-sand/50 overflow-y-auto px-6">
              {items.map((item) => (
                <li key={`${item.productId}-${item.color}`} className="flex gap-4 py-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-20 w-20 shrink-0 rounded-2xl object-cover"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/boutique/${item.slug}`}
                          onClick={closeCart}
                          className="text-sm font-bold hover:text-terra"
                        >
                          {item.name}
                        </Link>
                        {item.color && (
                          <p className="text-xs text-ink-soft">Coloris : {item.color}</p>
                        )}
                        {item.preorder && (
                          <p className="mt-1 text-xs font-bold text-terra-deep">
                            Pré-commande · bientôt disponible
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.productId, item.color)}
                        aria-label="Retirer l'article"
                        className="text-ink-faint transition-colors hover:text-terra"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-sand">
                        <button
                          onClick={() => setQuantity(item.productId, item.color, item.quantity - 1)}
                          className="px-3 py-1 text-ink-soft hover:text-ink"
                          aria-label="Diminuer la quantité"
                        >
                          −
                        </button>
                        <span className="min-w-6 text-center text-sm font-bold">{item.quantity}</span>
                        <button
                          onClick={() => setQuantity(item.productId, item.color, item.quantity + 1)}
                          className="px-3 py-1 text-ink-soft hover:text-ink disabled:opacity-30"
                          disabled={item.quantity >= (item.preorder ? 20 : item.stock)}
                          aria-label="Augmenter la quantité"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-bold">
                        {formatPrice(item.priceCents * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-sand/70 bg-cream px-6 py-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-ink-soft">Sous-total</span>
                <span className="font-display text-lg font-semibold">
                  {formatPrice(subtotalCents)}
                </span>
              </div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-ink-soft">
                  Livraison Colissimo · {formatWeight(totalWeightGrams)} · {shippingEstimate.label}
                </span>
                <span className="font-semibold">
                  {shippingCents === 0 ? "Offerte" : formatPrice(shippingCents)}
                </span>
              </div>
              <div className="mb-4 flex items-center justify-between border-t border-sand/60 pt-3">
                <span className="text-sm font-bold">Total estimé</span>
                <span className="font-display text-lg font-semibold">
                  {formatPrice(totalCents)}
                </span>
              </div>
              {error && (
                <p className="mb-3 rounded-xl bg-blush/40 px-4 py-2 text-xs font-semibold text-terra-deep">
                  {error}
                </p>
              )}
              <button
                onClick={checkout}
                disabled={loading}
                className="w-full rounded-full bg-terra py-3.5 text-sm font-bold text-cream transition-colors hover:bg-terra-deep disabled:opacity-60"
              >
                {loading ? "Un instant…" : "Passer commande"}
              </button>
              <p className="mt-3 text-center text-[11px] text-ink-faint">
                Paiement sécurisé par Stripe · Frais recalculés au paiement
              </p>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
