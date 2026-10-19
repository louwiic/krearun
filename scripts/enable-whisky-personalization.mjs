// node --env-file=.env scripts/enable-whisky-personalization.mjs [--apply]
// Enable the existing Red Bull personalization flow on the whisky holder for €3.
import { mkdirSync, writeFileSync } from "node:fs";

const base = process.env.POCKETBASE_URL?.replace(/\/$/, "");
if (!base) throw new Error("Configuration PocketBase manquante.");
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
const slug = "porte-verre-whisky";
const records = await pb(`/collections/products/records?perPage=2&filter=${encodeURIComponent(`slug='${slug}'`)}`);
if (records.items.length !== 1) throw new Error("Porte-verre à whisky absent ou ambigu.");
const product = records.items[0];
const patch = { namePersonalizationEnabled: true, namePersonalizationPriceCents: 300 };
console.log(JSON.stringify({ name: product.name, priceCents: product.priceCents, ...patch }));
if (!process.argv.includes("--apply")) process.exit(0);
const directory = `outputs/whisky-personalization-${new Date().toISOString().replace(/[:.]/g, "-")}`;
mkdirSync(directory, { recursive: true });
writeFileSync(`${directory}/before.json`, JSON.stringify(product, null, 2));
await pb(`/collections/products/records/${product.id}`, "PATCH", patch);
const checked = await pb(`/collections/products/records/${product.id}`);
for (const [key, value] of Object.entries(patch)) {
  if (checked[key] !== value) throw new Error(`Vérification échouée : ${key}`);
}
for (const key of Object.keys(product).filter((key) => key !== "updated" && !(key in patch))) {
  if (JSON.stringify(checked[key]) !== JSON.stringify(product[key])) throw new Error(`Champ modifié de manière inattendue : ${key}`);
}
writeFileSync(`${directory}/after.json`, JSON.stringify(checked, null, 2));
console.log("Vérifié : personnalisation facultative +3 €, prix de base et stock conservés.");
