import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";

for (const line of readFileSync(join(process.cwd(), ".env"), "utf8").split("\n")) {
  const match = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
}

const baseUrl = process.env.POCKETBASE_URL?.replace(/\/$/, "");
const email = process.env.POCKETBASE_ADMIN_EMAIL;
const password = process.env.POCKETBASE_ADMIN_PASSWORD;
const accountId = process.env.R2_ACCOUNT_ID ?? "";
const r2Endpoint =
  process.env.R2_ENDPOINT ??
  (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID ?? "";
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? "";
const r2Bucket = process.env.R2_BUCKET ?? "";
const r2PublicUrl = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

const missing = [
  ["POCKETBASE_URL", baseUrl],
  ["POCKETBASE_ADMIN_EMAIL", email],
  ["POCKETBASE_ADMIN_PASSWORD", password],
].filter(([, value]) => !value);

if (missing.length > 0) {
  console.error(`Configuration manquante : ${missing.map(([name]) => name).join(", ")}.`);
  process.exit(1);
}

const authResponse = await fetch(
  `${baseUrl}/api/collections/_superusers/auth-with-password`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: email, password }),
  },
);
const auth = await authResponse.json();

if (!authResponse.ok || !auth.token) {
  console.error("Échec de l’authentification PocketBase.");
  process.exit(1);
}

async function pocketbase(path, init = {}) {
  const response = await fetch(`${baseUrl}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: auth.token,
      ...init.headers,
    },
  });
  const body = response.status === 204 ? null : await response.json();
  return { ok: response.ok, status: response.status, body };
}

function publicObjectUrl(key) {
  if (r2PublicUrl.startsWith("/")) return `${r2PublicUrl}/${key}`;

  try {
    const configuredUrl = new URL(r2PublicUrl);
    if (configuredUrl.pathname.startsWith("/api/r2")) {
      return `${configuredUrl.pathname.replace(/\/$/, "")}/${key}`;
    }
  } catch {
    // Une URL publique externe valide reste utilisable ci-dessous.
  }

  return `${r2PublicUrl}/${key}`;
}

const slug = "porte-canette-red-bull";
const colorSources = [
  {
    file: "porte-canette-red-bull-bleu-rouge.png",
    name: "Bleu électrique & rouge",
    hex: "#0756d8",
  },
  {
    file: "porte-canette-red-bull-noir-rose.png",
    name: "Noir & rose fluo",
    hex: "#ff008c",
  },
  {
    file: "porte-canette-red-bull-blanc-bleu.png",
    name: "Blanc & bleu ciel",
    hex: "#22bdf2",
  },
];
const staticImages = colorSources.map(({ file }) => `/products/redbull/${file}`);
const hasR2Config = [r2Endpoint, r2AccessKeyId, r2SecretAccessKey, r2Bucket, r2PublicUrl].every(
  Boolean,
);

const payload = {
  name: "Porte-canette Red Bull",
  slug,
  tagline: "Le porte-canette imprimé en 3D pour garder votre boisson bien en main.",
  description:
    "Pensé pour les journées au bord de la piscine, les trajets ou les pauses bien fraîches, ce porte-canette imprimé en 3D accueille votre canette Red Bull avec une poignée stable et confortable.\n\nChaque pièce est imprimée couche par couche dans notre atelier, puis contrôlée avant expédition.\n\n• Compatible avec les canettes fines type Red Bull\n• PLA imprimé en 3D\n• Fabrication à la commande",
  priceCents: 1790,
  compareAtCents: 0,
  category: "deco",
  images: staticImages,
  videoUrl: "",
  weightGrams: 180,
  colors: colorSources.map(({ name, hex }, index) => ({
    name,
    hex,
    image: staticImages[index],
  })),
  stock: 197,
  featured: true,
  active: true,
  isNew: true,
  preorder: false,
  partnerShared: false,
  namePersonalizationEnabled: true,
  namePersonalizationPriceCents: 200,
  variants: [
    {
      id: "modele-avec-griffes-3d",
      name: "Avec griffes 3D",
      priceCents: 1790,
      stock: 98,
      weightGrams: 180,
      image: "",
      active: true,
    },
    {
      id: "modele-sans-griffes-3d",
      name: "Sans griffes 3D",
      priceCents: 1790,
      stock: 99,
      weightGrams: 180,
      image: "",
      active: true,
    },
  ],
  quantityDiscounts: [
    { minQuantity: 2, percent: 5 },
    { minQuantity: 4, percent: 10 },
    { minQuantity: 8, percent: 20 },
    { minQuantity: 10, percent: 30 },
  ],
};

const existing = await pocketbase(
  `/collections/products/records?perPage=1&filter=${encodeURIComponent(`slug='${slug}'`)}`,
);
if (!existing.ok) {
  console.error(`Lecture PocketBase impossible (${existing.status}).`);
  process.exit(1);
}

let record = existing.body?.items?.[0];
if (!record) {
  const created = await pocketbase("/collections/products/records", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!created.ok) {
    console.error(`Création PocketBase impossible (${created.status}).`, created.body);
    process.exit(1);
  }
  record = created.body;
}

let images = Array.isArray(record.images) && record.images.length === colorSources.length
  ? record.images
  : staticImages;
const needsR2Upload = hasR2Config && images.every((image) => image.startsWith("/products/redbull/"));

if (needsR2Upload) {
  const r2 = new S3Client({
    region: "auto",
    endpoint: r2Endpoint,
    credentials: {
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
    },
  });

  images = await Promise.all(
    colorSources.map(async ({ file }) => {
      const source = readFileSync(join(process.cwd(), "public/products/redbull", file));
      const body = await sharp(source).webp({ quality: 88 }).toBuffer();
      const key = `products/${record.id}/${Date.now()}-${randomUUID()}-${file.replace(/\.png$/, ".webp")}`;

      await r2.send(
        new PutObjectCommand({
          Bucket: r2Bucket,
          Key: key,
          Body: body,
          ContentType: "image/webp",
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
      return publicObjectUrl(key);
    }),
  );
}

const result = await pocketbase(`/collections/products/records/${record.id}`, {
  method: "PATCH",
  body: JSON.stringify({
    ...payload,
    images,
    colors: colorSources.map(({ name, hex }, index) => ({ name, hex, image: images[index] })),
  }),
});

if (!result.ok) {
  console.error(`Mise à jour PocketBase impossible (${result.status}).`, result.body);
  process.exit(1);
}

console.log(`Produit ${existing.body?.items?.[0] ? "mis à jour" : "créé"} : ${slug}`);
console.log(`${images.length} visuels liés aux coloris${needsR2Upload ? " via R2" : " depuis le projet"}.`);
