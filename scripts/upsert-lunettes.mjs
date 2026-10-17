// Preview: node --env-file=.env scripts/upsert-lunettes.mjs
// Apply:   node --env-file=.env scripts/upsert-lunettes.mjs --apply --stock=Q1,Q2,Q3,Q4,Q5,Q6
// Without confirmed stock, new products remain visible but unavailable (stock 0).
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const catalog = JSON.parse(readFileSync("data/lunettes.json", "utf8"));
const apply = process.argv.includes("--apply");
const stockArg = process.argv.find((arg) => arg.startsWith("--stock="))?.split("=")[1];
let stocks;
if (stockArg !== undefined) {
  stocks = stockArg.split(",").map(Number);
  if (stocks.length === 1) stocks = Array(6).fill(stocks[0]);
  if (stocks.length !== 6 || stocks.some((stock) => !Number.isInteger(stock) || stock < 0)) {
    throw new Error("Indiquer un stock entier positif ou nul, commun ou pour les six modèles.");
  }
}
const base = process.env.POCKETBASE_URL?.replace(/\/$/, "");
if (!base || !process.env.POCKETBASE_ADMIN_EMAIL || !process.env.POCKETBASE_ADMIN_PASSWORD) {
  throw new Error("Configuration PocketBase manquante.");
}
const authResponse = await fetch(`${base}/api/collections/_superusers/auth-with-password`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ identity: process.env.POCKETBASE_ADMIN_EMAIL, password: process.env.POCKETBASE_ADMIN_PASSWORD }),
});
const auth = await authResponse.json();
if (!authResponse.ok || !auth.token) throw new Error("Authentification PocketBase impossible.");
async function pb(path, method = "GET", body) {
  const response = await fetch(`${base}/api${path}`, {
    method, headers: { Authorization: auth.token, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(`PocketBase ${method} ${path}: ${response.status}`);
  return result;
}
const collection = await pb("/collections/products");
const category = collection.fields.find((field) => field.name === "category");
if (!category || category.type !== "select") throw new Error("Champ catégorie inattendu.");
const settings = (await pb("/collections/settings/records?perPage=1")).items[0];
if (!settings) throw new Error("Réglages boutique introuvables.");
const records = await Promise.all(catalog.map(async (item) =>
  (await pb(`/collections/products/records?perPage=1&filter=${encodeURIComponent(`slug='${item.slug}'`)}`)).items[0] ?? null
));
console.log(JSON.stringify(catalog.map((item, i) => ({
  name: item.name, slug: item.slug, priceCents: 1590,
  stock: stocks?.[i] ?? records[i]?.stock ?? 0, action: records[i] ? "update" : "create",
})), null, 2));
if (!apply) process.exit(0);

const publicBase = (process.env.R2_PUBLIC_URL || "").replace(/^"|"$/g, "").replace(/\/$/, "");
const endpoint = process.env.R2_ENDPOINT || (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : "");
if (![publicBase, endpoint, process.env.R2_ACCESS_KEY_ID, process.env.R2_SECRET_ACCESS_KEY, process.env.R2_BUCKET].every(Boolean)) {
  throw new Error("Configuration R2 manquante.");
}
const backupDir = `outputs/lunettes-${new Date().toISOString().replace(/[:.]/g, "-")}`;
mkdirSync(backupDir, { recursive: true });
writeFileSync(`${backupDir}/before.json`, JSON.stringify({ collection, settings, records }, null, 2));
const r2 = new S3Client({ region: "auto", endpoint, credentials: {
  accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
} });
// Upload every image before making the products visible.
const images = [];
for (const item of catalog) {
  const key = `products/lunettes/${item.image}`;
  await r2.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key,
    Body: readFileSync(`public/products/lunettes/${item.image}`), ContentType: "image/webp",
    CacheControl: "public, max-age=3600",
  }));
  const url = new URL(publicBase);
  const imageBase = url.pathname === "/api" ? "/api/r2"
    : url.pathname.startsWith("/api/r2") ? url.pathname.replace(/\/$/, "") : publicBase;
  images.push(`${imageBase}/${key}`);
}
if (!category.values.includes("lunette")) {
  category.values.push("lunette");
  await pb(`/collections/${collection.id}`, "PATCH", { fields: collection.fields });
}
const categories = JSON.parse(settings.categories_json || "[]");
const savedCategory = categories.find((item) => item.value === "lunette");
if (savedCategory) Object.assign(savedCategory, { label: "Lunette", active: true });
else categories.push({ value: "lunette", label: "Lunette", active: true });
await pb(`/collections/settings/records/${settings.id}`, "PATCH", { categories_json: JSON.stringify(categories) });
const results = [];
for (const [i, item] of catalog.entries()) {
  const product = {
    name: item.name, slug: item.slug, tagline: item.tagline,
    description: `${item.description}\n\nPrix : 15,90 € la paire.\nLivraison offerte sur ce modèle.`,
    priceCents: 1590, compareAtCents: 0, category: "lunette", images: [images[i]], videoUrl: "",
    colors: [{ name: item.color, hex: item.hex }],
    stock: stocks?.[i] ?? records[i]?.stock ?? 0, weightGrams: 0,
    active: true, featured: false, isNew: true, preorder: false, partnerShared: false,
    namePersonalizationEnabled: false, namePersonalizationPriceCents: 0,
    variants: [], quantityDiscounts: [],
  };
  const existing = records[i];
  const saved = await pb(existing ? `/collections/products/records/${existing.id}` : "/collections/products/records",
    existing ? "PATCH" : "POST", product);
  const checked = await pb(`/collections/products/records/${saved.id}`);
  if (checked.priceCents !== 1590 || checked.category !== "lunette" || checked.stock !== product.stock || !checked.active || checked.images[0] !== images[i]) {
    throw new Error(`Vérification échouée : ${item.slug}`);
  }
  results.push({ id: checked.id, name: checked.name, priceCents: checked.priceCents, stock: checked.stock, images: checked.images });
}
writeFileSync(`${backupDir}/after.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify({ verified: results, backupDir }, null, 2));
