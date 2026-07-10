"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { publicColorName } from "@/lib/colors";
import type { Product } from "@/lib/types";

export default function AddToCart({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [color, setColor] = useState(product.colors[0]?.name ?? "");
  const [customName, setCustomName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const maxQuantity = product.preorder ? 20 : product.stock;
  const soldOut = product.stock <= 0 && !product.preorder;
  const normalizedCustomName = customName.trim().replace(/\s+/g, " ");
  const missingCustomName = product.namePersonalizationEnabled && !normalizedCustomName;

  return (
    <div className="space-y-6">
      {product.colors.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-bold">
            Coloris — <span className="font-semibold text-ink-soft">{publicColorName(color)}</span>
          </p>
          <div className="flex gap-3">
            {product.colors.map((c) => (
              <button
                key={c.name}
                onClick={() => setColor(c.name)}
                title={publicColorName(c.name)}
                aria-label={`Coloris ${publicColorName(c.name)}`}
                className={`h-9 w-9 rounded-full border-2 transition-all ${
                  color === c.name
                    ? "scale-110 border-terra shadow-soft"
                    : "border-sand hover:border-ink-faint"
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>
      )}

      {product.namePersonalizationEnabled && (
        <label className="block">
          <span className="mb-2 block text-sm font-bold">Prénom à personnaliser *</span>
          <input
            value={customName}
            onChange={(event) => setCustomName(event.target.value)}
            maxLength={24}
            required
            placeholder="Ex. Léa"
            className="w-full rounded-2xl border border-sand bg-cream px-4 py-3 text-sm outline-none transition-colors placeholder:text-ink-faint focus:border-terra"
          />
          <span className="mt-2 block text-xs font-semibold text-ink-soft">
            24 caractères maximum, exactement comme vous souhaitez le voir apparaître.
          </span>
        </label>
      )}

      <div className="grid gap-3 sm:flex sm:items-center sm:gap-4">
        <div className="flex w-max items-center rounded-full border border-sand bg-cream">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-4 py-2.5 text-ink-soft hover:text-ink"
            aria-label="Diminuer la quantité"
          >
            −
          </button>
          <span className="min-w-8 text-center font-bold">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
            className="px-4 py-2.5 text-ink-soft hover:text-ink disabled:opacity-30"
            disabled={quantity >= maxQuantity}
            aria-label="Augmenter la quantité"
          >
            +
          </button>
        </div>

        <button
          onClick={() =>
            addItem(
              {
                productId: product.id,
                slug: product.slug,
                name: product.name,
                priceCents: product.priceCents,
                color: publicColorName(color),
                customName: product.namePersonalizationEnabled
                  ? normalizedCustomName
                  : undefined,
                image: product.images[0] ?? "",
                stock: product.stock,
                weightGrams: product.weightGrams,
                preorder: product.preorder,
              },
              quantity
            )
          }
          disabled={soldOut || missingCustomName}
          className="w-full rounded-full bg-terra px-8 py-3.5 text-sm font-bold text-cream transition-all hover:bg-terra-deep hover:shadow-lifted disabled:cursor-not-allowed disabled:bg-ink-faint sm:flex-1"
        >
          {soldOut
            ? "Bientôt de retour"
            : missingCustomName
              ? "Indiquer le prénom"
            : product.preorder
              ? "Pré-commander"
              : "Ajouter au panier"}
        </button>
      </div>

      {product.preorder && (
        <p className="rounded-2xl bg-sand/40 px-4 py-3 text-xs font-semibold leading-relaxed text-ink-soft">
          Bientôt disponible : votre pièce sera fabriquée dès le prochain lot.
        </p>
      )}

      {!soldOut && !product.preorder && product.stock <= 5 && (
        <p className="text-xs font-semibold text-terra-deep">
          Plus que {product.stock} exemplaire{product.stock > 1 ? "s" : ""} — le
          prochain lot est déjà en préparation ✿
        </p>
      )}
    </div>
  );
}
