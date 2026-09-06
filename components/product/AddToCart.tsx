"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { publicColorName } from "@/lib/colors";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import MonsterClawPreview from "./MonsterClawPreview";
import { discountedUnitPriceCents, quantityDiscountPercent } from "@/lib/quantity-discounts";

export default function AddToCart({ product }: { product: Product }) {
  const { addItem } = useCart();
  const activeVariants = product.variants.filter((variant) => variant.active);
  const [variantId, setVariantId] = useState(activeVariants[0]?.id ?? "");
  const [color, setColor] = useState(product.colors[0]?.name ?? "");
  const [addPersonalization, setAddPersonalization] = useState(false);
  const [customName, setCustomName] = useState("");
  const [keychainChoice, setKeychainChoice] = useState<"1" | "2" | "">("");
  const [quantity, setQuantity] = useState(1);
  const selectedVariant = activeVariants.find((variant) => variant.id === variantId);
  const selectedStock = selectedVariant?.stock ?? product.stock;
  const selectedWeight = selectedVariant?.weightGrams || product.weightGrams;
  const selectedImage = selectedVariant?.image || product.images[0] || "";
  const maxQuantity = product.preorder ? 20 : selectedStock;
  const soldOut = selectedStock <= 0 && !product.preorder;
  const normalizedCustomName = customName.trim().replace(/\s+/g, " ");
  const missingCustomName =
    product.namePersonalizationEnabled && addPersonalization && !normalizedCustomName;
  const selectedColor = product.colors.find((item) => item.name === color) ?? product.colors[0];
  const showMonsterPreview = product.slug === "porte-canette-monster" && Boolean(selectedColor);
  const missingKeychainChoice = product.slug === "porte-canette-monster" && !keychainChoice;
  const personalizationPriceCents = product.namePersonalizationEnabled && addPersonalization
    ? product.namePersonalizationPriceCents
    : 0;
  const modelPriceCents = selectedVariant?.priceCents || product.priceCents;
  const configuredPriceCents = modelPriceCents + personalizationPriceCents;
  const quantityDiscount = quantityDiscountPercent(product.quantityDiscounts, quantity);
  const discountedConfiguredPriceCents =
    discountedUnitPriceCents(modelPriceCents, product.quantityDiscounts, quantity) +
    personalizationPriceCents;

  return (
    <div className="space-y-5">
      {activeVariants.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-bold">
            Modèle — <span className="font-semibold text-ink-soft">{selectedVariant?.name}</span>
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {activeVariants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => {
                  setVariantId(variant.id);
                  setQuantity(1);
                  if (variant.image) {
                    window.dispatchEvent(
                      new CustomEvent("krearun:select-product-image", {
                        detail: { image: variant.image },
                      })
                    );
                  }
                }}
                className={`flex items-center gap-2.5 rounded-xl border-2 p-2.5 text-left transition-colors ${
                  variant.id === variantId
                    ? "border-ink bg-cream"
                    : "border-sand bg-cream/60 hover:border-ink-faint"
                }`}
              >
                {variant.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={variant.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{variant.name}</span>
                  <span className="mt-0.5 block text-xs text-ink-soft">
                    {formatPrice(variant.priceCents || product.priceCents)}
                    {!product.preorder && ` · ${variant.stock} en stock`}
                  </span>
                </span>
              </button>
            ))}
          </div>

          {product.slug === "porte-canette-monster" && selectedColor ? (
            <div className="rounded-xl border border-sand bg-cream/65 p-2.5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-bold">Accessoires inclus</p>
                <p className="flex items-center gap-1.5 text-[10px] font-semibold text-ink-soft">
                  <span
                    className="h-3 w-3 rounded-full border border-ink/20"
                    style={{ backgroundColor: selectedColor.hex }}
                  />
                  Assortis au coloris choisi
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex min-w-0 items-center gap-2 rounded-lg bg-white/75 p-1.5">
                  <span
                    aria-hidden
                    className="h-11 w-14 shrink-0 rounded-md bg-cover bg-no-repeat"
                    style={{
                      backgroundImage:
                        "url('/api/r2/products/monster/accessoires-monster-assortis.png')",
                      backgroundPosition: "66% 22%",
                      backgroundSize: "155%",
                    }}
                  />
                  <span className="min-w-0 text-[10px] font-bold leading-tight sm:text-[11px]">
                    Couvercle + décapsuleur griffes
                  </span>
                </div>
                <div className="min-w-0 rounded-lg bg-white/75 p-1.5">
                  <p className="mb-1 text-[10px] font-bold leading-tight sm:text-[11px]">
                    Porte-clés offert — choisissez votre modèle
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(["1", "2"] as const).map((choice) => (
                      <button
                        key={choice}
                        type="button"
                        onClick={() => setKeychainChoice(choice)}
                        aria-pressed={keychainChoice === choice}
                        className={`relative aspect-square overflow-hidden rounded-md border-2 bg-no-repeat transition-all ${
                          keychainChoice === choice
                            ? "border-terra ring-1 ring-terra"
                            : "border-sand hover:border-ink-faint"
                        }`}
                        style={{
                          backgroundImage:
                            "url('/api/r2/products/monster/choix-porte-cles-monster.png')",
                          backgroundPosition: choice === "1" ? "left center" : "right center",
                          backgroundSize: "200% auto",
                        }}
                      >
                        <span className="absolute bottom-0.5 left-0.5 bg-ink px-1 py-0.5 text-[8px] font-bold uppercase leading-none text-cream">
                          Choix {choice}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {product.colors.length > 0 && (
        <div className="space-y-3">
          <p className="mb-2 text-sm font-bold">
            Coloris — <span className="font-semibold text-ink-soft">{publicColorName(color)}</span>
          </p>
          {showMonsterPreview && selectedColor ? (
            <MonsterClawPreview
              color={selectedColor.hex}
              colorName={publicColorName(selectedColor.name)}
            />
          ) : null}
          <div className="flex flex-wrap gap-2.5">
            {product.colors.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setColor(c.name)}
                title={publicColorName(c.name)}
                aria-label={`Coloris ${publicColorName(c.name)}`}
                className={`h-8 w-8 rounded-full border-2 transition-all ${
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
        <div className="space-y-3">
          <p className="text-sm font-bold">
            Ajouter un prénom ?
            {product.namePersonalizationPriceCents > 0 && (
              <span className="ml-2 font-semibold text-ink-soft">
                + {formatPrice(product.namePersonalizationPriceCents)}
              </span>
            )}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setAddPersonalization(false);
                setCustomName("");
              }}
              className={`rounded-xl border px-4 py-2.5 text-sm font-bold ${
                !addPersonalization
                  ? "border-ink bg-ink text-cream"
                  : "border-sand bg-cream text-ink-soft"
              }`}
            >
              Non
            </button>
            <button
              type="button"
              onClick={() => setAddPersonalization(true)}
              className={`rounded-xl border px-4 py-2.5 text-sm font-bold ${
                addPersonalization
                  ? "border-ink bg-ink text-cream"
                  : "border-sand bg-cream text-ink-soft"
              }`}
            >
              Oui
            </button>
          </div>
          {addPersonalization && (
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Prénom à personnaliser *</span>
              <input
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                maxLength={24}
                required
                autoFocus
                placeholder="Ex. Léa"
                className="w-full rounded-2xl border border-sand bg-cream px-4 py-3 text-sm outline-none transition-colors placeholder:text-ink-faint focus:border-terra"
              />
              <span className="mt-2 block text-xs font-semibold text-ink-soft">
                24 caractères maximum, exactement comme vous souhaitez le voir apparaître.
              </span>
            </label>
          )}
        </div>
      )}

      {product.quantityDiscounts.length > 0 && (
        <div className="rounded-xl border border-terra/25 bg-terra/5 px-3 py-2.5">
          <p className="text-xs font-bold text-terra-deep">Prix dégressif automatique</p>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold text-ink-soft">
            {product.quantityDiscounts.map((discount) => (
              <span key={discount.minQuantity}>
                {discount.minQuantity} pièces : −{discount.percent} %
              </span>
            ))}
          </div>
        </div>
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
                priceCents: configuredPriceCents,
                color: publicColorName(color),
                customName: product.namePersonalizationEnabled && addPersonalization
                  ? normalizedCustomName
                  : undefined,
                variantId: selectedVariant?.id,
                variantName: selectedVariant?.name,
                keychainChoice: keychainChoice || undefined,
                image: selectedImage,
                stock: selectedStock,
                weightGrams: selectedWeight,
                preorder: product.preorder,
                personalizationPriceCents,
                quantityDiscounts: product.quantityDiscounts,
              },
              quantity
            )
          }
          disabled={soldOut || missingCustomName || missingKeychainChoice}
          className="w-full rounded-full bg-terra px-8 py-3.5 text-sm font-bold text-cream transition-all hover:bg-terra-deep hover:shadow-lifted disabled:cursor-not-allowed disabled:bg-ink-faint sm:flex-1"
        >
          {soldOut
            ? "Bientôt de retour"
            : missingCustomName
              ? "Indiquer le prénom"
            : missingKeychainChoice
              ? "Choisir le porte-clés offert"
            : product.preorder
              ? "Pré-commander"
              : `Ajouter au panier — ${formatPrice(discountedConfiguredPriceCents * quantity)}${
                  quantityDiscount > 0 ? ` (−${quantityDiscount} %)` : ""
                }`}
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
