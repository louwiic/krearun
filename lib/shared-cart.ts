import type { OrderItem, Product } from "./types";
import { cents } from "./order-management";
import { publicProductName } from "./public-copy";
import { variantQuantityDiscounts } from "./noel-kits";
import { discountedUnitPriceCents } from "./quantity-discounts";

export const SHARED_CART_MAX_LINES = 12;
export type SharedCartLine = { p: string; v?: string; q: number; u: number; label: string; c: string; n?: string; variant?: string };

export function quoteSharedCart(rows: unknown, products: Product[], shipping: string) {
  if (!Array.isArray(rows) || !rows.length || rows.length > SHARED_CART_MAX_LINES) throw new Error("Ajoutez de 1 à 12 lignes au panier.");
  if (!shipping.trim()) throw new Error("Indiquez les frais de livraison, ou 0 € pour les offrir.");
  const shippingCents = cents(shipping, "Livraison");
  if (shippingCents > 100_000) throw new Error("Frais de livraison trop élevés.");

  const byId = new Map(products.filter(product => product.active).map(product => [product.id, product]));
  const reserved = new Map<string, number>();
  const lines: SharedCartLine[] = rows.map((row, index) => {
    if (!row || typeof row !== "object") throw new Error(`Ligne ${index + 1} invalide.`);
    const value = (key: string) => typeof row[key] === "string" ? row[key].trim() : "";
    const quantity = Number(value("quantity"));
    const notes = value("notes");
    const color = value("color");
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99 || notes.length > 300 || color.length > 80) {
      throw new Error(`Vérifiez la quantité ou les détails de la ligne ${index + 1}.`);
    }

    if (row.kind === "custom") {
      const label = value("label");
      const u = cents(value("price"), "Prix unitaire");
      if (!label || label.length > 120 || u <= 0 || u > 10_000_000) throw new Error(`Indiquez un nom et un prix valides pour la ligne ${index + 1}.`);
      return { p: "shared-custom", q: quantity, u, label, c: color, n: notes || undefined };
    }

    const product = row.kind === "catalog" && byId.get(value("productId"));
    if (!product) throw new Error(`Choisissez un produit actif pour la ligne ${index + 1}.`);
    const label = publicProductName(product.slug, product.name);
    const variants = product.variants.filter(variant => variant.active);
    const variant = variants.find(item => item.id === value("variantId"));
    if (variants.length && !variant) throw new Error(`Choisissez une variante pour « ${label} ».`);
    const key = `${product.id}:${variant?.id ?? ""}`;
    const count = (reserved.get(key) ?? 0) + quantity;
    reserved.set(key, count);
    if (!product.preorder && count > (variant?.stock ?? product.stock)) throw new Error(`Stock insuffisant pour « ${label} ».`);

    const u = discountedUnitPriceCents(variant?.priceCents || product.priceCents, variantQuantityDiscounts(product, variant?.id), quantity);
    if (u <= 0) throw new Error(`Prix non renseigné pour « ${label} ».`);
    return { p: product.id, v: variant?.id, variant: variant?.name, q: quantity, u, label, c: color, n: notes || undefined };
  });
  const subtotalCents = lines.reduce((total, line) => total + line.u * line.q, 0);
  if (subtotalCents + shippingCents < 50 || subtotalCents + shippingCents > 99_999_999) throw new Error("Le total doit être compris entre 0,50 € et 999 999,99 €.");
  return { lines, shippingCents, subtotalCents };
}

export function sharedCartOrderItems(lines: SharedCartLine[]): OrderItem[] {
  return lines.map(line => ({
    productId: line.p, variantId: line.v, variantName: line.variant, name: line.label,
    quantity: line.q, priceCents: line.u, color: line.c, customName: line.n, image: "",
  }));
}
