// Crée la collection auth "boutique_admins" dans PocketBase et un premier
// compte admin. Usage :
//   node scripts/setup-admin-collection.mjs <email> <motdepasse>
import { readFileSync } from "node:fs";
import { join } from "node:path";

for (const line of readFileSync(join(process.cwd(), ".env"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const PB_URL = process.env.POCKETBASE_URL?.replace(/\/$/, "");
const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage : node scripts/setup-admin-collection.mjs <email> <motdepasse>");
  process.exit(1);
}

const auth = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    identity: process.env.POCKETBASE_ADMIN_EMAIL,
    password: process.env.POCKETBASE_ADMIN_PASSWORD,
  }),
}).then((r) => r.json());
if (!auth.token) {
  console.error("Échec d'authentification superuser :", auth);
  process.exit(1);
}
const headers = { "Content-Type": "application/json", Authorization: auth.token };

async function pb(path, init = {}) {
  const res = await fetch(`${PB_URL}/api${path}`, { ...init, headers });
  return { ok: res.ok, status: res.status, body: res.status === 204 ? null : await res.json() };
}

// 1. Collection auth (idempotent)
const existing = await pb(`/collections/boutique_admins`);
if (existing.ok) {
  console.log(`• Collection "boutique_admins" existe déjà`);
} else {
  const res = await pb(`/collections`, {
    method: "POST",
    body: JSON.stringify({
      name: "boutique_admins",
      type: "auth",
      passwordAuth: { enabled: true, identityFields: ["email"] },
      // Règles null = gestion des comptes réservée au superuser (via /_/).
      // L'endpoint auth-with-password reste utilisable pour se connecter.
    }),
  });
  if (!res.ok) {
    console.error("✗ Création collection :", JSON.stringify(res.body, null, 2));
    process.exit(1);
  }
  console.log(`✓ Collection "boutique_admins" créée`);
}

// 2. Compte admin (upsert par email)
const found = await pb(
  `/collections/boutique_admins/records?perPage=1&filter=${encodeURIComponent(`email='${email}'`)}`
);
const record = found.body?.items?.[0];
const payload = { email, password, passwordConfirm: password, verified: true };
const res = record
  ? await pb(`/collections/boutique_admins/records/${record.id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  : await pb(`/collections/boutique_admins/records`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
if (!res.ok) {
  console.error("✗ Compte admin :", JSON.stringify(res.body, null, 2));
  process.exit(1);
}
console.log(`✓ Compte admin "${email}" ${record ? "mis à jour" : "créé"}`);

// 3. Vérification : tentative de connexion
const check = await fetch(`${PB_URL}/api/collections/boutique_admins/auth-with-password`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ identity: email, password }),
});
console.log(check.ok ? "✓ Connexion testée avec succès" : `✗ Test de connexion : ${check.status}`);
