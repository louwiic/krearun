"use client";
import { createContext, useContext } from "react";
import { inventoryColorAvailable, availableInventoryPalette, usesInventoryPalette, type ColorAvailability } from "@/lib/color-availability";
import type { Product, ProductColor } from "@/lib/types";
const InventoryContext = createContext<ColorAvailability[]>([]);
export function ColorAvailabilityProvider({ colors, children }: { colors: ColorAvailability[]; children: React.ReactNode }) {
  return <InventoryContext.Provider value={colors}>{children}</InventoryContext.Provider>;
}
export function useColorAvailability(ignoreInventory = false) {
  const inventory = useContext(InventoryContext);
  return (color: ProductColor) => ignoreInventory || inventoryColorAvailable(color, inventory);
}
export function useProductColors(product: Pick<Product, "category" | "slug" | "colors">) {
  const inventory = useContext(InventoryContext);
  const required = usesInventoryPalette(product);
  return { colors: required ? availableInventoryPalette(inventory) : product.colors, required };
}
export function ProductColorDots({ colors, ignoreInventory, fromInventory }: { colors: ProductColor[]; ignoreInventory?: boolean; fromInventory?: boolean }) {
  const inventory = useContext(InventoryContext);
  const palette = fromInventory ? availableInventoryPalette(inventory) : colors;
  const available = useColorAvailability(ignoreInventory);
  return <>{palette.map((color, index) => <span key={`${color.name}-${index}`} title={`${color.name.replace(/^PLA\s+/i, "")}${available(color) ? "" : " — Rupture de stock"}`} className={`relative h-3.5 w-3.5 rounded-full border-2 border-ink sm:h-4 sm:w-4 ${available(color) ? "" : "color-swatch-unavailable opacity-60"}`} style={{ backgroundColor: color.hex }}/>)}</>;
}
