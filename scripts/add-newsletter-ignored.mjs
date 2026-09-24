// Migration ciblée et idempotente de la collection newsletter.
import { readFileSync } from "node:fs";

for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")) {
  const match = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
}

const url = process.env.POCKETBASE_URL?.replace(/\/$/, "");
const identity = process.env.POCKETBASE_ADMIN_EMAIL;
const password = process.env.POCKETBASE_ADMIN_PASSWORD;
if (!url || !identity || !password) throw new Error("Configuration PocketBase manquante.");

const auth = await fetch(`${url}/api/collections/_superusers/auth-with-password`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ identity, password }),
});
if (!auth.ok) throw new Error(`Authentification PocketBase : ${auth.status}`);
const { token } = await auth.json();
const headers = { Authorization: token, "Content-Type": "application/json" };
const collectionResponse = await fetch(`${url}/api/collections/newsletter`, { headers });
if (!collectionResponse.ok) throw new Error(`Lecture de la collection : ${collectionResponse.status}`);
const collection = await collectionResponse.json();
const missing = [
  { name: "ignored", type: "bool" },
  { name: "source", type: "text" },
].filter((field) => !collection.fields.some((existing) => existing.name === field.name));
if (missing.length === 0) {
  console.log("Champs de ciblage newsletter déjà présents.");
} else {
  const result = await fetch(`${url}/api/collections/newsletter`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ fields: [...collection.fields, ...missing] }),
  });
  if (!result.ok) throw new Error(`Migration newsletter.ignored : ${result.status}`);
  console.log(`Champs de ciblage ajoutés : ${missing.map((field) => field.name).join(", ")}.`);
}
