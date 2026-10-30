import type { ProductColor } from "./types";
export type ColorAvailability = { name: string; hex: string; active: boolean };
export function colorKey(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/^PLA\s+/i, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
export function inventoryColorAvailable(color: ProductColor, inventory: ColorAvailability[]): boolean {
  const named = inventory.filter(item => colorKey(item.name) === colorKey(color.name));
  const matching = named.length ? named : inventory.filter(item => item.hex.toLowerCase() === color.hex.toLowerCase());
  // Several spools of the same colour can coexist: one available spool is enough.
  return !matching.length || matching.some(item => item.active);
}
