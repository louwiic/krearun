import type { CartItem, Product } from "./types";

const FREE_SHIPPING_SLUGS = new Set([
  "porte-cle-coupe-du-monde-fifa",
  "decapsuleur-a-levier",
]);

export function hasFreeShipping(slug: string): boolean {
  return FREE_SHIPPING_SLUGS.has(slug);
}

export function billableWeight(items: CartItem[]): number {
  return items.reduce(
    (total, item) =>
      total + (hasFreeShipping(item.slug) ? 0 : item.weightGrams * item.quantity),
    0
  );
}

export function hasMissingBillableWeight(items: CartItem[]): boolean {
  return items.some((item) => !hasFreeShipping(item.slug) && item.weightGrams <= 0);
}

export function billableProductWeight(product: Product, quantity: number): number {
  return hasFreeShipping(product.slug) ? 0 : (product.weightGrams || 0) * quantity;
}

export function hasMissingProductWeight(product: Product): boolean {
  return !hasFreeShipping(product.slug) && product.weightGrams <= 0;
}
