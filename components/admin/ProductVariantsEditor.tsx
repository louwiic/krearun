"use client";

import { useState } from "react";
import type { ProductVariant } from "@/lib/types";

const field =
  "w-full rounded-xl border border-sand bg-linen px-3 py-2.5 text-sm outline-none focus:border-terra";

export default function ProductVariantsEditor({
  initialVariants,
  basePriceCents,
  baseStock,
  baseWeightGrams,
}: {
  initialVariants: ProductVariant[];
  basePriceCents: number;
  baseStock: number;
  baseWeightGrams: number;
}) {
  const [variants, setVariants] = useState(initialVariants);

  function update(id: string, patch: Partial<ProductVariant>) {
    setVariants((current) =>
      current.map((variant) => (variant.id === id ? { ...variant, ...patch } : variant))
    );
  }

  function addVariant() {
    setVariants((current) => [
      ...current,
      {
        id: `variant-${crypto.randomUUID()}`,
        name: `Modèle ${current.length + 1}`,
        priceCents: basePriceCents,
        stock: baseStock,
        weightGrams: baseWeightGrams,
        image: "",
        active: true,
      },
    ]);
  }

  return (
    <div className="rounded-blob bg-cream p-7 shadow-soft">
      <input type="hidden" name="variantsJson" value={JSON.stringify(variants)} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Modèles / variantes</h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-ink-faint">
            Chaque modèle peut avoir son prix, son stock, son poids et sa photo. Sans
            modèle, le produit utilise les informations principales ci-dessus.
          </p>
        </div>
        <button
          type="button"
          onClick={addVariant}
          className="rounded-full border border-ink bg-ink px-5 py-2.5 text-xs font-bold text-cream hover:bg-terra"
        >
          + Ajouter un modèle
        </button>
      </div>

      {variants.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-linen px-5 py-5 text-center text-sm text-ink-soft">
          Aucun modèle configuré.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {variants.map((variant, index) => (
            <fieldset key={variant.id} className="rounded-2xl border border-sand bg-white p-4">
              <legend className="px-2 text-xs font-bold uppercase tracking-wide text-terra">
                Variante {index + 1}
              </legend>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="lg:col-span-2">
                  <span className="mb-1 block text-xs font-bold text-ink-soft">Nom du modèle</span>
                  <input
                    value={variant.name}
                    onChange={(event) => update(variant.id, { name: event.target.value })}
                    required
                    className={field}
                    placeholder="Ex. Classique, avec couvercle…"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold text-ink-soft">Prix (€)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={(variant.priceCents / 100).toFixed(2)}
                    onChange={(event) =>
                      update(variant.id, {
                        priceCents: Math.max(0, Math.round((Number(event.target.value) || 0) * 100)),
                      })
                    }
                    className={field}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold text-ink-soft">Stock</span>
                  <input
                    type="number"
                    min="0"
                    value={variant.stock}
                    onChange={(event) => update(variant.id, { stock: Math.max(0, Number(event.target.value) || 0) })}
                    className={field}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold text-ink-soft">Poids emballé (g)</span>
                  <input
                    type="number"
                    min="0"
                    value={variant.weightGrams}
                    onChange={(event) => update(variant.id, { weightGrams: Math.max(0, Number(event.target.value) || 0) })}
                    className={field}
                  />
                </label>
                <label className="lg:col-span-2">
                  <span className="mb-1 block text-xs font-bold text-ink-soft">URL de la photo</span>
                  <input
                    value={variant.image}
                    onChange={(event) => update(variant.id, { image: event.target.value })}
                    className={field}
                    placeholder="Facultatif si vous uploadez une photo"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold text-ink-soft">Uploader la photo</span>
                  <input
                    type="file"
                    name={`variant_image_${variant.id}`}
                    accept="image/*"
                    className="block w-full text-xs text-ink-soft file:mr-2 file:rounded-full file:border-0 file:bg-sage/25 file:px-3 file:py-2 file:text-xs file:font-bold"
                  />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
                  <input
                    type="checkbox"
                    checked={variant.active}
                    onChange={(event) => update(variant.id, { active: event.target.checked })}
                    className="h-4 w-4 accent-terra"
                  />
                  Modèle disponible
                </label>
                <button
                  type="button"
                  onClick={() => setVariants((current) => current.filter((item) => item.id !== variant.id))}
                  className="text-xs font-bold text-terra-deep hover:underline"
                >
                  Supprimer cette variante
                </button>
              </div>
            </fieldset>
          ))}
        </div>
      )}
    </div>
  );
}
