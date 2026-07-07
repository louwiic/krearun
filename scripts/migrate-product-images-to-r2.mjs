// Copie les images produit existantes vers Cloudflare R2 puis remplace les URLs
// dans PocketBase. Usage : node scripts/migrate-product-images-to-r2.mjs [--dry-run]
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

for (const line of readFileSync(join(process.cwd(), ".env"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const dryRun = process.argv.includes("--dry-run");
const PB = (process.env.POCKETBASE_URL ?? "").replace(/\/$/, "");
const r2Endpoint =
  process.env.R2_ENDPOINT ||
  (process.env.R2_ACCOUNT_ID
    ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : "");
const r2PublicUrl = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

const required = {
  POCKETBASE_URL: PB,
  POCKETBASE_ADMIN_EMAIL: process.env.POCKETBASE_ADMIN_EMAIL,
  POCKETBASE_ADMIN_PASSWORD: process.env.POCKETBASE_ADMIN_PASSWORD,
  "R2_ENDPOINT ou R2_ACCOUNT_ID": r2Endpoint,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET: process.env.R2_BUCKET,
  R2_PUBLIC_URL: r2PublicUrl,
};

const missing = Object.entries(required)
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missing.length > 0) {
  console.error(`Configuration manquante : ${missing.join(", ")}`);
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: r2Endpoint,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const auth = await fetch(`${PB}/api/collections/_superusers/auth-with-password`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    identity: process.env.POCKETBASE_ADMIN_EMAIL,
    password: process.env.POCKETBASE_ADMIN_PASSWORD,
  }),
}).then((r) => r.json());

if (!auth.token) {
  console.error("Auth PocketBase échouée :", auth);
  process.exit(1);
}

const headers = { Authorization: auth.token };

function extensionFromContentType(contentType) {
  if (contentType.includes("image/webp")) return "webp";
  if (contentType.includes("image/jpeg")) return "jpg";
  if (contentType.includes("image/png")) return "png";
  if (contentType.includes("image/svg+xml")) return "svg";
  if (contentType.includes("image/gif")) return "gif";
  return "bin";
}

function cleanFilename(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function listProducts() {
  const products = [];
  let page = 1;
  while (true) {
    const res = await fetch(
      `${PB}/api/collections/products/records?perPage=100&page=${page}`,
      { headers }
    ).then((r) => r.json());
    products.push(...(res.items ?? []));
    if (page >= res.totalPages) return products;
    page += 1;
  }
}

async function uploadImage(product, imageUrl, index) {
  if (!/^https?:\/\//.test(imageUrl)) {
    console.log(`• ${product.name} : image relative ignorée (${imageUrl})`);
    return imageUrl;
  }
  if (imageUrl.startsWith(`${r2PublicUrl}/`)) {
    return imageUrl;
  }

  console.log(`→ ${product.name} : ${imageUrl}`);
  if (dryRun) return imageUrl;

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Téléchargement impossible (${response.status}) : ${imageUrl}`);
  }

  const contentType = response.headers.get("content-type") || "application/octet-stream";
  const pathName = new URL(imageUrl).pathname.split("/").pop() || `image-${index}`;
  const baseName = cleanFilename(pathName) || `image-${index}`;
  const key = `products/${product.id}/${index + 1}-${randomUUID()}-${baseName}.${extensionFromContentType(
    contentType
  )}`;
  const body = Buffer.from(await response.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return `${r2PublicUrl}/${key}`;
}

const products = await listProducts();
let updated = 0;

for (const product of products) {
  const images = Array.isArray(product.images) ? product.images : [];
  if (images.length === 0) continue;

  const nextImages = [];
  for (let i = 0; i < images.length; i += 1) {
    nextImages.push(await uploadImage(product, images[i], i));
  }

  const changed = nextImages.some((url, index) => url !== images[index]);
  if (!changed || dryRun) continue;

  const patch = await fetch(`${PB}/api/collections/products/records/${product.id}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ images: nextImages }),
  });
  if (!patch.ok) {
    throw new Error(`Patch PocketBase impossible pour ${product.name} : ${await patch.text()}`);
  }
  updated += 1;
  console.log(`✓ ${product.name} mis à jour`);
}

console.log(dryRun ? "Dry-run terminé." : `Migration terminée : ${updated} produit(s) mis à jour.`);

