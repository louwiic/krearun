import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";

// node --env-file=.env scripts/upsert-whisky-glass-holder.mjs
// Creates an inactive draft; price and stock must be entered before publication.
const base = process.env.POCKETBASE_URL?.replace(/\/$/, "");
const authResponse = await fetch(`${base}/api/collections/_superusers/auth-with-password`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ identity: process.env.POCKETBASE_ADMIN_EMAIL, password: process.env.POCKETBASE_ADMIN_PASSWORD }),
});
const auth = await authResponse.json();
if (!authResponse.ok || !auth.token) throw new Error("Authentification PocketBase impossible.");

async function pb(path, method = "GET", body) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: { Authorization: auth.token, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(`PocketBase ${method} ${path}: ${response.status} ${JSON.stringify(result)}`);
  return result;
}

const slug = "porte-verre-whisky";
const existing = await pb(`/collections/products/records?filter=${encodeURIComponent(`slug='${slug}'`)}`);
if (existing.items.length) {
  console.log(`Produit déjà présent : ${existing.items[0].id}. Aucune modification.`);
  process.exit(0);
}

const collection = await pb("/collections/products");
const category = collection.fields.find((field) => field.name === "category");
if (!category || category.type !== "select") throw new Error("Champ catégorie inattendu.");
if (!category.values.includes("porte-boisson")) {
  category.values.push("porte-boisson");
  await pb(`/collections/${collection.id}`, "PATCH", { fields: collection.fields });
}
const settings = (await pb("/collections/settings/records?perPage=1")).items[0];
if (!settings) throw new Error("Réglages boutique introuvables.");
const categories = JSON.parse(settings.categories_json || "[]");
if (!categories.some((item) => item.value === "porte-boisson")) {
  categories.push({ value: "porte-boisson", label: "Porte-boisson", active: true });
  await pb(`/collections/settings/records/${settings.id}`, "PATCH", { categories_json: JSON.stringify(categories) });
}

const publicBase = (process.env.R2_PUBLIC_URL || "").replace(/^"|"$/g, "").replace(/\/$/, "");
const endpoint = process.env.R2_ENDPOINT || (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : "");
if (![publicBase, endpoint, process.env.R2_ACCESS_KEY_ID, process.env.R2_SECRET_ACCESS_KEY, process.env.R2_BUCKET].every(Boolean)) {
  throw new Error("Configuration R2 manquante.");
}
const key = `products/${slug}/${randomUUID()}.webp`;
const image = await sharp(readFileSync("public/products/whisky/porte-verre-whisky.png")).webp({ quality: 88 }).toBuffer();
const r2 = new S3Client({ region: "auto", endpoint, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } });
await r2.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, Body: image, ContentType: "image/webp", CacheControl: "public, max-age=31536000, immutable" }));
let imageBase = publicBase;
if (!publicBase.startsWith("/")) {
  const url = new URL(publicBase);
  if (url.pathname === "/api") imageBase = "/api/r2";
  else if (url.pathname.startsWith("/api/r2")) imageBase = url.pathname.replace(/\/$/, "");
}
const payload = {
  name: "Porte-verre à whisky", slug,
  tagline: "Un porte-verre noir au motif ajouré pour accompagner votre whisky.",
  description: "Porte-verre à whisky noir avec motif décoratif ajouré.\n\nDimensions :\n• Longueur : 15 cm\n• Diamètre : 5 cm",
  category: "porte-boisson", images: [`${imageBase}/${key}`], videoUrl: "",
  priceCents: 0, compareAtCents: 0, stock: 0, weightGrams: 0,
  colors: [{ name: "Noir", hex: "#171717" }],
  active: false, featured: false, isNew: true, preorder: false,
  partnerShared: false, namePersonalizationEnabled: true, namePersonalizationPriceCents: 300,
  variants: [], quantityDiscounts: [],
};
const created = await pb("/collections/products/records", "POST", payload);
const saved = await pb(`/collections/products/records/${created.id}`);
if (saved.slug !== slug || saved.active || saved.category !== "porte-boisson" || !saved.images?.length) {
  throw new Error("La vérification du brouillon a échoué.");
}
console.log(JSON.stringify({ id: saved.id, name: saved.name, category: saved.category, active: saved.active, description: saved.description, images: saved.images }));
