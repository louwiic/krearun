import type { CartItem, Product } from "./types";

const FREE_SHIPPING_SLUGS = new Set(["porte-cle-coupe-du-monde-fifa"]);

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

export function billableProductWeight(product: Product, quantity: number): number {
  return hasFreeShipping(product.slug) ? 0 : (product.weightGrams || 0) * quantity;
}
