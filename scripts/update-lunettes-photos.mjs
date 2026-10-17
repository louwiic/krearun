// node --env-file=.env scripts/update-lunettes-photos.mjs [--apply]
// Only updates images; never touches stock, prices or product copy.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const catalog = JSON.parse(readFileSync("data/lunettes.json", "utf8"));
const base = process.env.POCKETBASE_URL?.replace(/\/$/, "");
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
  if (!response.ok) throw new Error(`PocketBase ${method}: ${response.status}`);
  return response.json();
}
const publicBase = (process.env.R2_PUBLIC_URL || "").replace(/^"|"$/g, "").replace(/\/$/, "");
const url = new URL(publicBase);
const imageBase = url.pathname === "/api" ? "/api/r2"
  : url.pathname.startsWith("/api/r2") ? url.pathname.replace(/\/$/, "") : publicBase;
const plan = [];
for (const item of catalog) {
  const records = await pb(`/collections/products/records?perPage=2&filter=${encodeURIComponent(`slug='${item.slug}'`)}`);
  if (records.items.length !== 1) throw new Error(`Produit absent ou ambigu : ${item.slug}`);
  const record = records.items[0];
  const stem = item.image.replace(/\.webp$/, "");
  const body = readFileSync(`public/products/lunettes/${stem}-studio.webp`);
  const hash = createHash("sha256").update(body).digest("hex").slice(0, 12);
  const key = `products/lunettes/${stem}-studio-${hash}.webp`;
  const images = [`${imageBase}/${key}`, ...(record.images || []).filter((image) => !image.includes(`${stem}-studio-`))];
  plan.push({ record, body, key, images });
}
console.log(JSON.stringify(plan.map(({ record, images }) => ({ name: record.name, images })), null, 2));
if (!process.argv.includes("--apply")) process.exit(0);
const backupDir = `outputs/lunettes-photos-${new Date().toISOString().replace(/[:.]/g, "-")}`;
mkdirSync(backupDir, { recursive: true });
writeFileSync(`${backupDir}/before.json`, JSON.stringify(plan.map(({ record }) => record), null, 2));
const endpoint = process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const r2 = new S3Client({ region: "auto", endpoint, credentials: {
  accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
} });
// Upload the complete set before changing any record.
for (const { body, key } of plan) {
  await r2.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, Body: body,
    ContentType: "image/webp", CacheControl: "public, max-age=31536000, immutable" }));
}
for (const { record, images } of plan) {
  await pb(`/collections/products/records/${record.id}`, "PATCH", { images });
  const checked = await pb(`/collections/products/records/${record.id}`);
  if (JSON.stringify(checked.images) !== JSON.stringify(images)) throw new Error(`Images non enregistrées : ${record.slug}`);
  console.log(`Vérifié : ${checked.name} — ${checked.images.length} photos`);
}
console.log(`Sauvegarde : ${backupDir}`);
