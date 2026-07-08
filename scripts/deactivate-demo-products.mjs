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
  console.error("Variables PocketBase manquantes");
  process.exit(1);
}

const authRes = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ identity: EMAIL, password: PASSWORD }),
});
const auth = await authRes.json();
if (!auth.token) {
  console.error("Auth PocketBase impossible");
  process.exit(1);
}

async function pb(path, init = {}) {
  const res = await fetch(`${PB_URL}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: auth.token,
    },
  });
  const body = res.status === 204 ? null : await res.json();
  return { ok: res.ok, status: res.status, body };
}

const res = await pb("/collections/products/records?perPage=500");
if (!res.ok) {
  console.error("Lecture produits impossible", res.body);
  process.exit(1);
}

let count = 0;
for (const product of res.body.items ?? []) {
  const images = Array.isArray(product.images) ? product.images : [];
  const isDemo = images.length > 0 && images.every((image) => String(image).startsWith("/products/"));
  if (!isDemo) continue;

  const patch = await pb(`/collections/products/records/${product.id}`, {
    method: "PATCH",
    body: JSON.stringify({ active: false, featured: false, isNew: false }),
  });
  if (!patch.ok) {
    console.error(`Erreur ${product.slug}`, patch.body);
    continue;
  }
  count += 1;
  console.log(`désactivé: ${product.slug}`);
}

console.log(`${count} produit(s) de démonstration désactivé(s)`);
