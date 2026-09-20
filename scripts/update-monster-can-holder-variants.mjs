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
      ...init.headers,
    },
  });
  const body = response.status === 204 ? null : await response.json();
  return { ok: response.ok, status: response.status, body };
}

const slug = "porte-canette-monster";
const response = await pocketbase(
  `/collections/products/records?perPage=1&filter=${encodeURIComponent(`slug='${slug}'`)}`,
);
const product = response.body?.items?.[0];

if (!response.ok || !product) {
  console.error("Produit Monster introuvable.");
  process.exit(1);
}

const productImage = product.images?.[0] ?? "";
const baseVariant = {
  priceCents: product.priceCents,
  weightGrams: product.weightGrams,
  image: productImage,
  active: true,
};

const variants = [
  {
    id: "modele-avec-griffes-3d",
    name: "Avec griffes 3D",
    stock: 98,
    ...baseVariant,
  },
  {
    id: "modele-sans-griffes-3d",
    name: "Sans griffes 3D",
    stock: 99,
    ...baseVariant,
    colors: [
      { name: "Noir", hex: "#101312", image: productImage },
      { name: "Blanc", hex: "#f7f5f0", image: productImage },
    ],
  },
];

const updated = await pocketbase(`/collections/products/records/${product.id}`, {
  method: "PATCH",
  body: JSON.stringify({ variants }),
});

if (!updated.ok) {
  console.error(`Mise à jour PocketBase impossible (${updated.status}).`);
  process.exit(1);
}

console.log("Variantes Monster mises à jour : Avec griffes 3D, Sans griffes 3D (Noir, Blanc).");
