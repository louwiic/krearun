import { readFileSync } from "node:fs";
import { join } from "node:path";

for (const line of readFileSync(join(process.cwd(), ".env"), "utf8").split("\n")) {
  const match = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
}

const baseUrl = process.env.POCKETBASE_URL?.replace(/\/$/, "");
const email = process.env.POCKETBASE_ADMIN_EMAIL;
const password = process.env.POCKETBASE_ADMIN_PASSWORD;

if (!baseUrl || !email || !password) {
  console.error("Configuration PocketBase manquante.");
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
    },
  });
  const body = response.status === 204 ? null : await response.json();
  return { ok: response.ok, status: response.status, body };
}

const slug = "decapsuleur-a-levier";
const product = {
  name: "Décapsuleur à levier",
  slug,
  tagline: "Ouvrez vos bouteilles en un geste, sans effort.",
  description:
    "Un décapsuleur à levier original et pratique, fabriqué sur demande dans notre atelier à La Réunion. Placez-le sur la capsule, actionnez le levier et profitez.\n\n• Système à levier simple à utiliser\n• Impression 3D soignée\n• Fabriqué sur demande\n• Livraison offerte sur ce produit",
  priceCents: 890,
  compareAtCents: 0,
  category: "deco",
  images: ["/products/decapsuleur-a-levier.webp"],
  videoUrl: "",
  weightGrams: 80,
  colors: [{ name: "Gris argenté", hex: "#9b9b96" }],
  stock: 0,
  featured: false,
  active: true,
  isNew: true,
  preorder: true,
  partnerShared: false,
  namePersonalizationEnabled: false,
};

const existing = await pocketbase(
  `/collections/products/records?perPage=1&filter=${encodeURIComponent(`slug='${slug}'`)}`,
);
const record = existing.body?.items?.[0];
const result = record
  ? await pocketbase(`/collections/products/records/${record.id}`, {
      method: "PATCH",
      body: JSON.stringify(product),
    })
  : await pocketbase("/collections/products/records", {
      method: "POST",
      body: JSON.stringify(product),
    });

if (!result.ok) {
  console.error(`Erreur PocketBase (${result.status})`, result.body);
  process.exit(1);
}

console.log(`Produit ${record ? "mis à jour" : "créé"} : ${slug}`);
