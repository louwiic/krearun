import type { Order, Product } from "./types";

export type OrderImageProduct = { id: string; name: string; images: string[] };
export function orderImageUrl(raw: unknown): string {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value || value.length > 2000 || /[\\\r\n]/.test(value)) return "";
  if (/^\/(products|uploads|api\/r2)\//.test(value)) return value;
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.toString() : ""; } catch { return ""; }
}
export function orderImageProducts(products: Product[]): OrderImageProduct[] {
  return products.map(product => ({ id: product.id, name: product.name, images: [...new Set([
    ...product.images, ...product.colors.map(color => color.image),
    ...product.variants.flatMap(variant => [variant.image, ...(variant.colors ?? []).map(color => color.image)]),
  ].map(orderImageUrl).filter(Boolean))] }));
}
export function orderImages(order: Pick<Order, "productImage" | "items">, catalog: OrderImageProduct[] = []): { src: string; name: string }[] {
  const manual = orderImageUrl(order.productImage);
  if (manual) return [{ src: manual, name: "Photo de la commande" }];
  const images = order.items.map(item => ({ src: orderImageUrl(item.image) || catalog.find(product => product.id === item.productId)?.images[0] || "", name: item.name })).filter(image => image.src);
  return images.filter((image, index) => images.findIndex(other => other.src === image.src) === index);
}
