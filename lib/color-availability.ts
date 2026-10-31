import type { ProductColor } from "./types";
export type ColorAvailability = { name: string; hex: string; active: boolean; swatchImage?: string };
export function usesInventoryPalette(product: { category: string; slug: string }): boolean {
  return product.category === "noel" && product.slug.startsWith("noel-thermoforme-");
}
export function availableInventoryPalette(inventory: ColorAvailability[]): ProductColor[] {
  const seen = new Set<string>();
  return inventory.filter(color => {
    const key = colorKey(color.name);
    if (!color.active || !key || !/^#[0-9a-f]{6}$/i.test(color.hex) || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map(({ name, hex, swatchImage }) => ({ name: name.replace(/^PLA\s+/i, "").trim(), hex, ...(swatchImage ? { swatchImage } : {}) }));
}
export function colorKey(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/^PLA\s+/i, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
export function inventoryColorAvailable(color: ProductColor, inventory: ColorAvailability[]): boolean {
  const named = inventory.filter(item => colorKey(item.name) === colorKey(color.name));
  const matching = named.length ? named : inventory.filter(item => item.hex.toLowerCase() === color.hex.toLowerCase());
  // Several spools of the same colour can coexist: one available spool is enough.
  return !matching.length || matching.some(item => item.active);
}
