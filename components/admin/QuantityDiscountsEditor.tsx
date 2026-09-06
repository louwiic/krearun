"use client";

import { useState } from "react";
import type { QuantityDiscount } from "@/lib/types";

const field =
  "w-full rounded-xl border border-sand bg-linen px-3 py-2.5 text-sm outline-none focus:border-terra";

export default function QuantityDiscountsEditor({
  initialDiscounts,
}: {
  initialDiscounts: QuantityDiscount[];
}) {
  const [discounts, setDiscounts] = useState(initialDiscounts);

  function update(index: number, patch: Partial<QuantityDiscount>) {
    setDiscounts((current) =>
      current.map((discount, candidate) =>
        candidate === index ? { ...discount, ...patch } : discount
      )
    );
  }

  return (
    <div className="rounded-blob bg-cream p-7 shadow-soft">
      <input type="hidden" name="quantityDiscountsJson" value={JSON.stringify(discounts)} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Prix dégressifs</h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-ink-faint">
            La meilleure remise atteinte s’applique automatiquement à toutes les unités du produit.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDiscounts((current) => [...current, { minQuantity: 2, percent: 5 }])}
          className="rounded-full border border-ink bg-ink px-5 py-2.5 text-xs font-bold text-cream hover:bg-terra"
        >
          + Ajouter une tranche
        </button>
      </div>

      {discounts.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-linen px-5 py-4 text-center text-sm text-ink-soft">
          Aucun prix dégressif configuré.
        </p>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {discounts.map((discount, index) => (
            <div key={index} className="rounded-2xl border border-sand bg-white p-3">
              <div className="grid grid-cols-2 gap-2">
                <label>
                  <span className="mb-1 block text-[11px] font-bold text-ink-soft">Dès quantité</span>
                  <input
                    type="number"
                    min="2"
                    step="1"
                    value={discount.minQuantity}
                    onChange={(event) => update(index, { minQuantity: Number(event.target.value) || 2 })}
                    className={field}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-[11px] font-bold text-ink-soft">Remise (%)</span>
                  <input
                    type="number"
                    min="1"
                    max="95"
                    step="1"
                    value={discount.percent}
                    onChange={(event) => update(index, { percent: Number(event.target.value) || 1 })}
                    className={field}
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={() => setDiscounts((current) => current.filter((_, candidate) => candidate !== index))}
                className="mt-2 text-[11px] font-bold text-terra-deep hover:underline"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
