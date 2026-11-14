"use client";

import { colorSwatchStyle } from "@/lib/color-swatches";
import NoelKitOptions from "./NoelKitOptions";
import { noelKitCount, noelKitVariants, variantQuantityDiscounts } from "@/lib/noel-kits";
import { useColorAvailability, useProductColors } from "./ColorAvailabilityProvider";
import NosPersonalization from "./NosPersonalization";
import { NOS_SLUG } from "@/lib/nos";
import { MONSTER_GIFT } from "@/lib/monster-gift";
import { useEffect, useState } from "react";
import { SWEAT_SLUG, SWEAT_COLOR_EVENT } from "@/lib/sweat-preview";
import { NOS_COLOR_EVENT } from "@/lib/nos-preview";
import Link from "next/link";
import { HOLDER_SLUG } from "@/lib/custom-holder";
import { useCart } from "@/components/cart/CartContext";
import { publicColorName } from "@/lib/colors";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import {BIRTH_LETTER_SLUG,EMPTY_BIRTH_LETTER,buildBirthLetter} from "@/lib/birth-letter";
import BirthLetterPersonalization from "./BirthLetterPersonalization";
import LampPersonalization from "./LampPersonalization";
import { buildLampPersonalization, isPersonalizedLamp } from "@/lib/lamp-personalization";
import { MONSTER_MULTICOLOR_CENTS, monsterColorLabel, type MonsterColors } from "@/lib/monster-multicolor";
import { MONSTER_SLUG, MONSTER_COLOR_EVENT } from "@/lib/monster-preview";
import { discountedUnitPriceCents, quantityDiscountPercent } from "@/lib/quantity-discounts";

export default function AddToCart({ product }: { product: Product }) {
  const { addItem } = useCart();
  const isColorAvailable = useColorAvailability(product.category === "lunette");
  const { colors: productColors, required: inventoryPalette } = useProductColors(product);
  const activeVariants = product.variants.filter((variant) => variant.active);
  const [variantId, setVariantId] = useState(activeVariants[0]?.id ?? "");
  const [monsterColors,setMonsterColors]=useState<MonsterColors|undefined>();
  const [requestedColor, setColor] = useState(productColors.find(isColorAvailable)?.name ?? "");
  const [addPersonalization, setAddPersonalization] = useState(false);
  const [customName, setCustomName] = useState("");
  const [birth,setBirth]=useState(EMPTY_BIRTH_LETTER);
  const birthLetter=product.slug===BIRTH_LETTER_SLUG;
  const personalizedLamp = isPersonalizedLamp(product.slug);
  const [lamp, setLamp] = useState({ initial: "", text: "", secondName: "", motif: "Étoiles", otherMotif: "", hearts: "2", inscription: "" });
  const lampDetails = birthLetter ? buildBirthLetter(birth) : buildLampPersonalization(product.slug, lamp);
  const [quantity, setQuantity] = useState(1);
  const selectedVariant = activeVariants.find((variant) => variant.id === variantId);
  const availableColors = !inventoryPalette && selectedVariant?.colors?.length ? selectedVariant.colors : productColors;
  const selectedColor = availableColors.find((item) => item.name === requestedColor && isColorAvailable(item)) ?? availableColors.find(isColorAvailable);
  const color = selectedColor?.name ?? "";
  const colorsSoldOut = (inventoryPalette || availableColors.length > 0) && !selectedColor;
  const selectedStock = birthLetter ? 20 : selectedVariant?.stock ?? product.stock;
  const selectedWeight = selectedVariant?.weightGrams || product.weightGrams;
  const selectedImage = selectedColor?.image || selectedVariant?.image || product.images[0] || (product.privateSale ? "/products/sur-mesure.svg" : "/products/hero.svg");
  const maxQuantity = product.preorder ? 20 : selectedStock;
  const soldOut = colorsSoldOut || (selectedStock <= 0 && !product.preorder);
  const normalizedCustomName = customName.trim().replace(/\s+/g, " ");
  const missingCustomName =
    personalizedLamp ? !lampDetails : product.namePersonalizationEnabled && addPersonalization && !normalizedCustomName;
  const personalizationPriceCents = !personalizedLamp && product.namePersonalizationEnabled && addPersonalization
    ? product.namePersonalizationPriceCents
    : 0;
  const multicolorPriceCents = product.slug === MONSTER_SLUG && monsterColors ? MONSTER_MULTICOLOR_CENTS : 0;
  const modelPriceCents = selectedVariant?.priceCents || product.priceCents;
  const configuredPriceCents = modelPriceCents + personalizationPriceCents + multicolorPriceCents;
  const priceDiscounts = variantQuantityDiscounts(product, selectedVariant?.id);
  const kitCount = noelKitCount(product.slug, selectedVariant?.id);
  const hasNoelKits = noelKitVariants(product).length > 0;
  const quantityDiscount = quantityDiscountPercent(priceDiscounts, quantity);
  const discountedConfiguredPriceCents =
    discountedUnitPriceCents(modelPriceCents, priceDiscounts, quantity) +
    personalizationPriceCents + multicolorPriceCents;

  useEffect(() => {
    if (product.slug !== MONSTER_SLUG) return;
    const select = (event: Event) => {
      const detail = (event as CustomEvent<{name:string;parts?:MonsterColors}>).detail;
      const match = product.colors.find(item => publicColorName(item.name) === detail?.name);
      if (match) {setColor(match.name);setMonsterColors(detail.parts);}
    };
    window.addEventListener(MONSTER_COLOR_EVENT, select);
    return () => window.removeEventListener(MONSTER_COLOR_EVENT, select);
  }, [product.slug, product.colors]);

  if (product.slug === HOLDER_SLUG) return <Link href={`/boutique/${HOLDER_SLUG}`} className="inline-flex rounded-full bg-terra px-6 py-4 font-bold text-white">Personnaliser et demander une validation →</Link>;

  return (
    <div className="min-w-0 space-y-5">
      {hasNoelKits && <NoelKitOptions product={product} selected={selectedVariant} onSelect={variant=>{setVariantId(variant.id);setQuantity(1);}} />}
      {!hasNoelKits && activeVariants.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-bold">
            Modèle — <span className="font-semibold text-ink-soft">{selectedVariant?.name}</span>
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {activeVariants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => {
                  const variantColors = !inventoryPalette && variant.colors?.length ? variant.colors : productColors;
                  const nextColor =
                    variantColors.find((item) => item.name === color && isColorAvailable(item)) ?? variantColors.find(isColorAvailable);
                  setVariantId(variant.id);
                  setColor(nextColor?.name ?? "");
                  setQuantity(1);
                  const image = nextColor?.image || variant.image;
                  if (image) {
                    window.dispatchEvent(
                      new CustomEvent("krearun:select-product-image", {
                        detail: { image },
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

        </div>
      )}

      {product.slug === "porte-canette-monster" && selectedColor ? (
        <div className="rounded-xl border border-sand bg-cream/65 p-2.5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-bold">Accessoires inclus</p>
            <p className="flex items-center gap-1.5 text-[10px] font-semibold text-ink-soft">
              <span
                className="h-3 w-3 rounded-full border border-ink/20"
                style={colorSwatchStyle(selectedColor)}
              />
              Assortis au coloris choisi
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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

          </div>
        </div>
      ) : null}

      {availableColors.length > 0 && (
        <div className={product.slug === MONSTER_SLUG ? "hidden" : "space-y-3"}>
          <p className="mb-2 text-sm font-bold">
            {birthLetter ? "Couleur de la grande lettre" : "Coloris"} — <span className="font-semibold text-ink-soft">{color ? publicColorName(color) : "Aucun coloris disponible"}</span>
          </p>
          <div className="flex flex-wrap gap-2.5">
            {availableColors.map((c) => (
              <button
                key={c.name}
                type="button"
                disabled={!isColorAvailable(c)}
                onClick={() => {
                  setColor(c.name);
                  if (product.slug === MONSTER_SLUG) window.dispatchEvent(new CustomEvent(MONSTER_COLOR_EVENT, {detail:{name:publicColorName(c.name),hex:c.hex}}));
                  if (product.slug === SWEAT_SLUG) window.dispatchEvent(new CustomEvent(SWEAT_COLOR_EVENT, {detail:{name:publicColorName(c.name),hex:c.hex}}));
                  if (product.slug === NOS_SLUG) window.dispatchEvent(new CustomEvent(NOS_COLOR_EVENT, {detail:{name:publicColorName(c.name),hex:c.hex}}));
                  if (c.image) {
                    window.dispatchEvent(
                      new CustomEvent("krearun:select-product-image", {
                        detail: { image: c.image },
                      })
                    );
                  }
                }}
                title={`${publicColorName(c.name)}${isColorAvailable(c) ? "" : " — Rupture de stock"}`}
                aria-label={`Coloris ${publicColorName(c.name)}${isColorAvailable(c) ? "" : " — Rupture de stock"}`}
                className={`relative h-8 w-8 rounded-full border-2 transition-all disabled:cursor-not-allowed disabled:opacity-60 ${!isColorAvailable(c) ? "color-swatch-unavailable" : ""} ${
                  color === c.name
                    ? "scale-110 border-terra shadow-soft"
                    : "border-sand hover:border-ink-faint"
                }`}
                style={colorSwatchStyle(c)}
              />
            ))}
          </div>
          {availableColors.some(c => !isColorAvailable(c)) && <p className="text-xs font-semibold text-ink-soft">Coloris barrés : rupture de stock.</p>}
        </div>
      )}
      {inventoryPalette && !birthLetter && <p className="text-xs leading-relaxed text-ink-soft">Choisissez la couleur principale de votre décoration parmi les coloris disponibles à l’atelier. Les détails du motif gardent leurs couleurs ; les moules du kit sont fournis dans un coloris d’atelier.</p>}

      {product.slug === NOS_SLUG && <p className="text-xs text-ink-soft">L’aperçu 3D suit votre choix de couleur. La photo réelle présente le modèle bleu.</p>}

      {birthLetter && <BirthLetterPersonalization value={birth} onChange={setBirth} colors={availableColors.filter(isColorAvailable)}/> }
      {personalizedLamp && !birthLetter && <LampPersonalization slug={product.slug} value={lamp} onChange={setLamp} />}

      {product.slug === NOS_SLUG && product.namePersonalizationEnabled && <NosPersonalization value={customName} priceCents={product.namePersonalizationPriceCents} onChange={(value,enabled)=>{setCustomName(value);setAddPersonalization(enabled);}} />}

      {!personalizedLamp && product.slug !== NOS_SLUG && product.namePersonalizationEnabled && (
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

      {priceDiscounts.length > 0 && (
        <div className="rounded-xl border border-terra/25 bg-terra/5 px-3 py-2.5">
          <p className="text-xs font-bold text-terra-deep">Prix dégressif automatique</p>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold text-ink-soft">
            {priceDiscounts.map((discount) => (
              <span key={discount.minQuantity}>
                {discount.minQuantity} pièces : −{discount.percent} %
              </span>
            ))}
          </div>
        </div>
      )}

      {kitCount && <p className="text-sm font-semibold">Nombre de kits complets à commander — chaque kit comprend son jeu de moules.</p>}
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
                color: monsterColors ? monsterColorLabel(monsterColors) : publicColorName(color),
                customName: personalizedLamp ? lampDetails : product.namePersonalizationEnabled && addPersonalization
                  ? normalizedCustomName
                  : undefined,
                variantId: selectedVariant?.id,
                variantName: selectedVariant?.name,
                keychainChoice: product.slug === "porte-canette-monster" ? MONSTER_GIFT : undefined,
                image: selectedImage,
                stock: selectedStock,
                weightGrams: selectedWeight,
                preorder: product.preorder,
                personalizationPriceCents:personalizationPriceCents + multicolorPriceCents,
                quantityDiscounts: priceDiscounts,
              },
              quantity
            )
          }
          disabled={soldOut || missingCustomName}
          className="w-full rounded-full bg-terra px-8 py-3.5 text-sm font-bold text-cream transition-all hover:bg-terra-deep hover:shadow-lifted disabled:cursor-not-allowed disabled:bg-ink-faint sm:flex-1"
        >
          {soldOut
            ? (colorsSoldOut ? "Coloris en rupture de stock" : "Bientôt de retour")
            : missingCustomName
              ? birthLetter ? "Compléter la lettre de naissance" : "Indiquer le prénom"
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

      {!soldOut && !birthLetter && !product.preorder && product.stock <= 5 && (
        <p className="text-xs font-semibold text-terra-deep">
          Plus que {product.stock} exemplaire{product.stock > 1 ? "s" : ""} — le
          prochain lot est déjà en préparation ✿
        </p>
      )}
    </div>
  );
}
