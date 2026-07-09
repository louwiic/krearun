// Ajoute le champ booléen namePersonalizationEnabled à la collection products.
// Usage : node scripts/add-product-name-personalization-field.mjs
import { readFileSync } from "node:fs";
import { join } from "node:path";

for (const line of readFileSync(join(process.cwd(), ".env"), "utf8").split("\n")) {
  const match = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
}

const PB_URL = process.env.POCKETBASE_URL?.replace(/\/$/, "");
const EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

if (!PB_URL || !EMAIL || !PASSWORD) {
  console.error("POCKETBASE_URL / POCKETBASE_ADMIN_EMAIL / POCKETBASE_ADMIN_PASSWORD manquants dans .env");
  process.exit(1);
}

const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ identity: EMAIL, password: PASSWORD }),
});
const auth = await authRes.json();
if (!auth.token) {
  console.error("Échec d'authentification PocketBase :", auth);
  process.exit(1);
}

const headers = { "Content-Type": "application/json", Authorization: auth.token };
const collectionRes = await fetch(`${PB_URL}/api/collections/products`, { headers });
const collection = await collectionRes.json();

if (!collectionRes.ok) {
  console.error("Collection products introuvable :", collection);
  process.exit(1);
}

const fields = collection.fields ?? [];
if (fields.some((field) => field.name === "namePersonalizationEnabled")) {
  console.log("• Champ namePersonalizationEnabled déjà présent");
  process.exit(0);
}

const patchRes = await fetch(`${PB_URL}/api/collections/products`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({
    fields: [...fields, { name: "namePersonalizationEnabled", type: "bool" }],
  }),
});
const patch = patchRes.status === 204 ? null : await patchRes.json();

if (!patchRes.ok) {
  console.error("Échec de migration :", patch);
  process.exit(1);
}

console.log("✓ Champ namePersonalizationEnabled ajouté à products");
