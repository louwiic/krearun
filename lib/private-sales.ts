import { randomBytes } from "node:crypto";
import { slugify } from "./format";

// Unlisted bearer link: anyone with the link can open and order the offer.
export function privateSaleSlug(name: string, existingSlug?: string): string {
  return existingSlug || `${slugify(name).slice(0, 70) || "creation"}-${randomBytes(12).toString("hex")}`;
}

export function parsePrivateSale(form: FormData, allowSoldOut = false) {
  const name = String(form.get("name") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const price = String(form.get("price") ?? "").trim().replace(",", ".");
  if (!name || name.length > 150) throw new Error("Indiquez un nom de 1 à 150 caractères.");
  if (!description || description.length > 10000) throw new Error("Décrivez la demande du client (10 000 caractères maximum).");
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(price) || Number(price) <= 0) {
    throw new Error("Indiquez un prix positif en euros, avec deux décimales maximum.");
  }
  const integer = (key: string, max: number, label: string, min = 1) => {
    const raw = String(form.get(key) ?? "");
    const value = Number(raw);
    if (!/^\d+$/.test(raw) || !Number.isSafeInteger(value) || value < min || value > max) {
      throw new Error(`${label} doit être compris entre ${min} et ${max}.`);
    }
    return value;
  };
  return { name, description, priceCents: Math.round(Number(price) * 100),
    stock: integer("stock", 10000, "Le stock", allowSoldOut ? 0 : 1), weightGrams: integer("weightGrams", 30000, "Le poids emballé en grammes") };
}
