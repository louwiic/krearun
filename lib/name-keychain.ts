import type { Product } from "./types";
import { availableInventoryPalette, colorKey, type ColorAvailability } from "./color-availability";
export const KEYCHAIN_ID = "name-keychain";
export const KEYCHAIN_SLUG = "porte-cles-prenom";
export const KEYCHAIN_PRICE_CENTS = 1200;
export const KEYCHAIN_FONTS = [
  { id: "chewy", label: "Chewy", file: "Chewy-Regular.ttf", description: "Ronde et joyeuse" },
  { id: "lilita", label: "Lilita One", file: "LilitaOne-Regular.ttf", description: "Lettres épaisses" },
  { id: "pacifico", label: "Pacifico", file: "Pacifico-Regular.ttf", description: "Écriture cursive" },
] as const;
export type KeychainConfiguration = { borderWidthMm?: number; name: string; font: typeof KEYCHAIN_FONTS[number]["id"]; style: "relief" | "mono"; baseColor: string; baseColorName: string; textColor: string; textColorName: string };
export const KEYCHAIN_PRODUCT: Product = {
  id: KEYCHAIN_ID, slug: KEYCHAIN_SLUG, name: "Porte-clés prénom personnalisé", tagline: "Votre prénom, votre police et vos couleurs. Livraison incluse.",
  description: "Composez votre porte-clés prénom, en relief bicolore ou en lettres unies. Fabriqué à la commande dans notre atelier à La Réunion. Anneau inclus.",
  category: "deco", priceCents: KEYCHAIN_PRICE_CENTS, images: ["/keychains/relief-reference.png", "/keychains/script-reference.png", "/keychains/block-reference.png"], videoUrl: "",
  weightGrams: 30, stock: 999, active: true, featured: false, isNew: true, preorder: false, partnerShared: false,
  namePersonalizationEnabled: false, namePersonalizationPriceCents: 0, variants: [], colors: [], quantityDiscounts: [], createdAt: "2026-11-10T00:00:00Z", updatedAt: "2026-11-10T00:00:00Z",
};
export function parseKeychainConfiguration(value: unknown): KeychainConfiguration {
  if (!value || typeof value !== "object") throw new Error("Configuration du porte-clés invalide.");
  const v = value as Record<string, unknown>;
  const name = typeof v.name === "string" ? v.name.normalize("NFC").trim().replace(/\s+/g, " ") : "";
  if (!/^[\p{L}][\p{L}\p{M} '’‐-]{0,17}$/u.test(name) || !/\p{L}/u.test(name)) throw new Error("Indiquez un prénom de 1 à 18 caractères (lettres, espaces, apostrophes ou tirets).");
  if (!KEYCHAIN_FONTS.some(font => font.id === v.font) || (v.style !== "relief" && v.style !== "mono")) throw new Error("Choisissez une police et un modèle disponibles.");
  for (const key of ["baseColor", "textColor"] as const) if (typeof v[key] !== "string" || !/^#[a-f0-9]{6}$/i.test(v[key])) throw new Error("Couleur invalide.");
  for (const key of ["baseColorName", "textColorName"] as const) if (typeof v[key] !== "string" || !v[key].trim() || v[key].length > 100) throw new Error("Choisissez vos couleurs.");
  const borderWidthMm = v.borderWidthMm === undefined ? (v.style === "relief" ? 2.2 : 0.8) : v.borderWidthMm;
  if(typeof borderWidthMm !== "number" || !Number.isFinite(borderWidthMm) || borderWidthMm < 0.8 || borderWidthMm > 4) throw new Error("Choisissez une largeur de fond entre 0,8 et 4 mm.");
  return { borderWidthMm: Math.round(borderWidthMm * 10) / 10, name, font: v.font as KeychainConfiguration["font"], style: v.style, baseColor: v.baseColor as string, baseColorName: String(v.baseColorName).trim(),
    textColor: v.style === "mono" ? v.baseColor as string : v.textColor as string, textColorName: v.style === "mono" ? String(v.baseColorName).trim() : String(v.textColorName).trim() };
}
export function validateKeychainColors(value: unknown, inventory: ColorAvailability[]) {
  const config = parseKeychainConfiguration(value);
  const palette = availableInventoryPalette(inventory);
  for (const part of ["base", "text"] as const) {
    const color = palette.find(color => colorKey(color.name) === colorKey(config[`${part}ColorName`]) && color.hex.toLowerCase() === config[`${part}Color`].toLowerCase());
    if (!color) throw new Error("Une couleur choisie n’est plus disponible. Sélectionnez un coloris en stock.");
    config[`${part}ColorName`] = color.name;
    config[`${part}Color`] = color.hex;
  }
  return config;
}
export function keychainLabel(config: KeychainConfiguration) {
  return `${config.name} · ${KEYCHAIN_FONTS.find(font => font.id === config.font)!.label} · ${config.style === "relief" ? "Relief bicolore" : "Lettres unies"}${config.borderWidthMm !== undefined ? ` · Fond ${config.borderWidthMm.toFixed(1).replace(".",",")} mm` : ""}`;
}
export type KeychainFile = { id: string; uniqueKey: string; orderId: string; orderNumber: number; itemIndex: number; source: "order" | "admin"; configuration: KeychainConfiguration; file: string; originalName: string; created: string };
