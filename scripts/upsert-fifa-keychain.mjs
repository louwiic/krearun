import { readFileSync } from "node:fs";
import { join } from "node:path";

for (const line of readFileSync(join(process.cwd(), ".env"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const PB_URL = process.env.POCKETBASE_URL?.replace(/\/$/, "");
const EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

if (!PB_URL || !EMAIL || !PASSWORD) {
  console.error("POCKETBASE_URL / POCKETBASE_ADMIN_EMAIL / POCKETBASE_ADMIN_PASSWORD manquants.");
  process.exit(1);
}

const auth = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ identity: EMAIL, password: PASSWORD }),
}).then((r) => r.json());

if (!auth.token) {
  console.error("Echec d'authentification PocketBase :", auth);
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  Authorization: auth.token,
};

async function pb(path, init = {}) {
  const res = await fetch(`${PB_URL}/api${path}`, { ...init, headers });
  const body = res.status === 204 ? null : await res.json();
  return { ok: res.ok, status: res.status, body };
}

const slug = "porte-cle-coupe-du-monde-fifa";
const product = {
  name: "Porte-clé Coupe du Monde FIFA",
  slug,
  tagline: "Porte-clé noir et doré, livraison offerte.",
  description:
    "Un porte-clé noir et doré inspiré de l'esprit Coupe du Monde, léger et facile à accrocher à vos clés, votre sac ou votre trousse.\n\n• Finition noir et or\n• Format compact du quotidien\n• Livraison offerte sur ce produit",
  priceCents: 590,
  compareAtCents: 0,
  category: "deco",
  images: ["/products/porte-cle-coupe-du-monde-fifa.png"],
  videoUrl: "",
  weightGrams: 30,
  colors: [
    { name: "Noir et doré", hex: "#12100d" },
    { name: "Doré", hex: "#d5a62f" },
  ],
  stock: 50,
  featured: true,
  active: true,
  isNew: true,
  preorder: false,
  namePersonalizationEnabled: false,
};

const pickupPoints = [
  {
    id: "saint-pierre-mon-caprice",
    name: "Saint-Pierre Mon Caprice",
    address: "Saint-Pierre, quartier Mon Caprice",
    schedule: "Samedi et dimanche, sur rendez-vous",
    note: "Créneau confirmé par message après la commande.",
    active: true,
  },
  {
    id: "saint-leu-portail",
    name: "Saint-Leu Portail",
    address: "Saint-Leu, secteur Portail",
    schedule: "Samedi et dimanche, sur rendez-vous",
    note: "Créneau confirmé par message après la commande.",
    active: true,
  },
  {
    id: "le-port-sacre-coeur",
    name: "Le Port Sacré Cœur",
    address: "Le Port, secteur Sacré Cœur",
    schedule: "Samedi et dimanche, sur rendez-vous",
    note: "Créneau confirmé par message après la commande.",
    active: true,
  },
];

const existing = await pb(
  `/collections/products/records?perPage=1&filter=${encodeURIComponent(`slug='${slug}'`)}`
);
const record = existing.body?.items?.[0];
const result = record
  ? await pb(`/collections/products/records/${record.id}`, {
      method: "PATCH",
      body: JSON.stringify(product),
    })
  : await pb("/collections/products/records", {
      method: "POST",
      body: JSON.stringify(product),
    });

if (!result.ok) {
  console.error("Erreur produit :", JSON.stringify(result.body, null, 2));
  process.exit(1);
}

console.log(`Produit ${record ? "mis a jour" : "cree"} : ${slug}`);

const settings = await pb("/collections/settings/records?perPage=1");
const settingsRecord = settings.body?.items?.[0];
if (settingsRecord) {
  const settingsResult = await pb(`/collections/settings/records/${settingsRecord.id}`, {
    method: "PATCH",
    body: JSON.stringify({ pickup_points_json: JSON.stringify(pickupPoints) }),
  });
  if (!settingsResult.ok) {
    console.error("Erreur reglages :", JSON.stringify(settingsResult.body, null, 2));
    process.exit(1);
  }
  console.log("Points de retrait mis a jour");
}
