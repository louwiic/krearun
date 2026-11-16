import type { OrderItem, Product, ProductColor } from "./types";

export type OrderColorCatalog = {
  inventory: ProductColor[];
  products: Record<string, { colors: ProductColor[]; variants: Record<string, ProductColor[]> }>;
};

export function buildOrderColorCatalog(products: Product[], inventory: ProductColor[]): OrderColorCatalog {
  return {
    inventory: inventory.map(({ name, hex }) => ({ name, hex })),
    products: Object.fromEntries(products.map((product) => [product.id, {
      colors: product.colors.map(({ name, hex }) => ({ name, hex })),
      variants: Object.fromEntries(product.variants.map((variant) => [variant.id,
        (variant.colors ?? []).map(({ name, hex }) => ({ name, hex })),
      ])),
    }])),
  };
}

const normalize = (name: string) => name.trim().replace(/^PLA\s+/i, "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ");
const basicColors: Record<string, string> = {
  noir: "#171717", blanc: "#ffffff", bleu: "#2563eb", rouge: "#dc2626",
  vert: "#16a34a", jaune: "#facc15", orange: "#f97316", rose: "#ec4899",
  violet: "#9333ea", gris: "#9ca3af", marron: "#92400e", beige: "#d6c5a3",
};
const isHex = (value: string) => /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);

export function resolveOrderColor(name: string, item: Pick<OrderItem, "productId" | "variantId">, catalog?: OrderColorCatalog): (string | null)[] {
  const product = catalog?.products[item.productId];
  const colors = [
    ...(item.variantId ? product?.variants[item.variantId] ?? [] : []),
    ...(product?.colors ?? []),
    ...(catalog?.inventory ?? []),
  ];
  const resolve = (value: string) => {
    if (isHex(value)) return value;
    const match = colors.find((color) => normalize(color.name) === normalize(value) && isHex(color.hex));
    return match?.hex ?? basicColors[normalize(value)] ?? null;
  };
  const exact = resolve(name);
  if (exact) return [exact];
  return name.split(/\s*[&/+]+\s*/).map(resolve);
}

export function isOrderColorDetail(label: string): boolean {
  return ["Coloris", "Base", "Caps", "Lettres et symbole", "Couleur de la lettre", "Couleur du prénom"].includes(label);
}

/** Keep historical/custom colors selectable even when absent from today's catalogue. */
export function orderItemColorChoices(item: Pick<OrderItem, "productId" | "variantId" | "color">, catalog?: OrderColorCatalog): string[] {
  const product = catalog?.products[item.productId];
  return [...new Set([item.color, ...(item.variantId ? product?.variants[item.variantId] ?? [] : [] ).map(color => color.name), ...(product?.colors ?? []).map(color => color.name), ...(catalog?.inventory ?? []).map(color => color.name)])];
}

export function updateOrderItemColors(items: OrderItem[], data: FormData, catalog: OrderColorCatalog): OrderItem[] {
  return items.map((item, index) => {
    const key = `itemColor_${index}`;
    if (!data.has(key)) return item;
    const color = String(data.get(key) ?? "").trim();
    if (!orderItemColorChoices(item, catalog).includes(color)) throw new Error("Coloris invalide pour cet article. Recharge la page et réessaie.");
    return color === item.color ? item : { ...item, color };
  });
}
