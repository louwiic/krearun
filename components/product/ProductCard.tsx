/* eslint-disable @next/next/no-img-element -- Product media from the existing storage. */
import Link from "next/link";
import { ProductColorDots } from "./ColorAvailabilityProvider";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { hasFreeShipping } from "@/lib/free-shipping";
import { HOLDER_SLUG } from "@/lib/custom-holder";
import { usesInventoryPalette } from "@/lib/color-availability";

export default function ProductCard({ product, className = "", showCta = false, priority = false }: { product: Product; className?: string; showCta?: boolean; priority?: boolean }) {
  const variants = product.variants.filter(variant => variant.active);
  const stock = variants.length ? variants.reduce((total, variant) => total + variant.stock, 0) : product.stock;
  const prices = variants.map(variant => variant.priceCents || product.priceCents).filter(price => price > 0);
  const price = prices.length ? Math.min(...prices) : product.priceCents;
  const personalized = product.slug === HOLDER_SLUG;
  const soldOut = !personalized && stock <= 0 && !product.preorder;
  return <Link href={`/boutique/${product.slug}`} data-product-impression={product.id} data-product-click={product.id} className={`editorial-product-card group ${className}`}>
    <div className="editorial-product-image">
      <img src={product.images[0] ?? "/products/hero.svg"} alt={product.name} width={800} height={800} decoding="async" loading={priority ? "eager" : "lazy"} className="aspect-square h-full w-full object-cover" />
      {product.images[1] && <img src={product.images[1]} alt="" aria-hidden width={800} height={800} decoding="async" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />}
      {(soldOut || product.preorder || product.isNew) && <span className="editorial-product-badge">{soldOut ? "Épuisé" : product.preorder ? "Précommande" : "Nouveau"}</span>}
    </div>
    <div className="pt-4">
      <h3 className="editorial-product-title">{product.name}</h3>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs sm:text-sm"><span>{personalized ? "Sur validation" : `${prices.length > 1 ? "À partir de " : ""}${formatPrice(price)}`}</span>{product.compareAtCents && <span className="text-ink-faint line-through">{formatPrice(product.compareAtCents)}</span>}</div>
      {hasFreeShipping(product.slug) && <p className="mt-1 text-[10px] uppercase tracking-wide">Livraison offerte</p>}
      {(product.colors.length > 0 || usesInventoryPalette(product)) && <div className="mt-3 flex flex-wrap gap-1.5"><ProductColorDots colors={product.colors} ignoreInventory={product.category === "lunette"} fromInventory={usesInventoryPalette(product)} /></div>}
      {showCta && <span className="mt-4 inline-block text-xs underline underline-offset-4">{personalized ? "Créer le mien" : "Découvrir"} ↗</span>}
    </div>
  </Link>;
}
