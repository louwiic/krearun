import type { Product, ProductVariant, QuantityDiscount } from "./types";

export const NOEL_KIT_MAX_COUNT = 10;
export function noelKitCount(slug: string, variantId?: string): number | null {
  const source = /^noel-thermoforme-(\d+)$/.exec(slug)?.[1];
  if (!source || !variantId) return null;
  if (variantId === `noel-${source}-kit`) return 1;
  const match = new RegExp(`^noel-${source}-kit-([0-9]+)$`).exec(variantId);
  const count = match ? Number(match[1]) : 0;
  return count >= 2 && count <= NOEL_KIT_MAX_COUNT ? count : null;
}
export function noelKitVariants(product: Pick<Product,"slug"|"variants">): ProductVariant[] {
  return product.variants.filter(v=>v.active && noelKitCount(product.slug,v.id) !== null).sort((a,b)=>noelKitCount(product.slug,a.id)!-noelKitCount(product.slug,b.id)!);
}
export function variantQuantityDiscounts(product: Pick<Product,"slug"|"quantityDiscounts">, variantId?: string): QuantityDiscount[] {
  // Kit prices already include their piece-count tier and a single set of moulds.
  return noelKitCount(product.slug,variantId) ? [] : product.quantityDiscounts;
}
export function extraDecorationDiscount(count: number) {
  return count >= 10 ? 15 : count >= 5 ? 10 : count >= 3 ? 5 : 0;
}
export function noelKitPriceCents(baseKitCents: number, extraDecorationCents: number, count: number) {
  if (!Number.isInteger(count) || count < 1 || count > NOEL_KIT_MAX_COUNT) throw new Error("Le kit comprend entre 1 et 10 décorations.");
  if (!Number.isSafeInteger(baseKitCents) || baseKitCents <= 0 || !Number.isSafeInteger(extraDecorationCents) || extraDecorationCents <= 0) throw new Error("Tarif de kit invalide.");
  const extra = (count-1)*extraDecorationCents*(100-extraDecorationDiscount(count))/100;
  return baseKitCents + Math.round(extra/10)*10;
}
