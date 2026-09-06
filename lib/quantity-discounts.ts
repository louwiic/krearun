import type { QuantityDiscount } from "@/lib/types";

export function normalizeQuantityDiscounts(value: unknown): QuantityDiscount[] {
  if (!Array.isArray(value)) return [];

  const byQuantity = new Map<number, number>();
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Partial<QuantityDiscount>;
    const minQuantity = Math.max(2, Math.floor(Number(candidate.minQuantity) || 0));
    const percent = Math.min(95, Math.max(1, Math.round(Number(candidate.percent) || 0)));
    if (minQuantity >= 2 && percent > 0) byQuantity.set(minQuantity, percent);
  }

  return [...byQuantity.entries()]
    .map(([minQuantity, percent]) => ({ minQuantity, percent }))
    .sort((a, b) => a.minQuantity - b.minQuantity)
    .slice(0, 20);
}

export function quantityDiscountPercent(
  discounts: QuantityDiscount[] | undefined,
  quantity: number
): number {
  return normalizeQuantityDiscounts(discounts).reduce(
    (best, tier) => (quantity >= tier.minQuantity ? tier.percent : best),
    0
  );
}

export function discountedUnitPriceCents(
  basePriceCents: number,
  discounts: QuantityDiscount[] | undefined,
  quantity: number
): number {
  const percent = quantityDiscountPercent(discounts, quantity);
  return Math.max(0, Math.round(basePriceCents * (100 - percent) / 100));
}

export function cartUnitPriceCents(item: {
  priceCents: number;
  personalizationPriceCents?: number;
  quantityDiscounts?: QuantityDiscount[];
  quantity: number;
}): number {
  const personalization = Math.max(0, item.personalizationPriceCents ?? 0);
  const productPrice = Math.max(0, item.priceCents - personalization);
  return discountedUnitPriceCents(productPrice, item.quantityDiscounts, item.quantity) + personalization;
}
