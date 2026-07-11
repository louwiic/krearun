import { readFileSync } from "node:fs";
import { join } from "node:path";

for (const line of readFileSync(join(process.cwd(), ".env"), "utf8").split("\n")) {
  const match = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
}

const url = process.env.POCKETBASE_URL?.replace(/\/$/, "");
const identity = process.env.POCKETBASE_ADMIN_EMAIL;
const password = process.env.POCKETBASE_ADMIN_PASSWORD;
if (!url || !identity || !password) throw new Error("Variables PocketBase manquantes.");

const authentication = await fetch(`${url}/api/collections/_superusers/auth-with-password`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ identity, password }),
}).then((response) => response.json());
if (!authentication.token) throw new Error("Authentification PocketBase impossible.");

const headers = { "Content-Type": "application/json", Authorization: authentication.token };
const collection = await fetch(`${url}/api/collections/products`, { headers }).then((response) => response.json());
if (collection.fields?.some((field) => field.name === "partnerShared")) {
  console.log("• Champ products.partnerShared déjà présent");
  process.exit(0);
}

const response = await fetch(`${url}/api/collections/products`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({
    fields: [...(collection.fields ?? []), { name: "partnerShared", type: "bool" }],
  }),
});
if (!response.ok) throw new Error(`Mise à jour PocketBase impossible (${response.status}).`);
console.log("✓ Champ products.partnerShared ajouté");
