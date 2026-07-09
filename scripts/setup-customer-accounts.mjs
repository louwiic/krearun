// Crée les collections nécessaires aux comptes clients.
// Usage :
//   node scripts/setup-customer-accounts.mjs
import { readFileSync } from "node:fs";
import { join } from "node:path";

for (const line of readFileSync(join(process.cwd(), ".env"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const PB_URL = process.env.POCKETBASE_URL?.replace(/\/$/, "");
if (!PB_URL) {
  console.error("POCKETBASE_URL manquante");
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
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}

async function ensureCollection(name, payload) {
  const existing = await pb(`/collections/${name}`);
  if (existing.ok) {
    console.log(`• Collection "${name}" existe déjà`);
    return;
  }
  const created = await pb(`/collections`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!created.ok) {
    console.error(`✗ Collection "${name}" :`, JSON.stringify(created.body, null, 2));
    process.exit(1);
  }
  console.log(`✓ Collection "${name}" créée`);
}

await ensureCollection("customers", {
  name: "customers",
  type: "auth",
  passwordAuth: { enabled: true, identityFields: ["email"] },
  fields: [
    { name: "name", type: "text" },
    { name: "phone", type: "text" },
    { name: "addressLine1", type: "text" },
    { name: "addressLine2", type: "text" },
    { name: "city", type: "text" },
    { name: "postalCode", type: "text" },
    { name: "country", type: "text" },
  ],
});

await ensureCollection("customer_activation_tokens", {
  name: "customer_activation_tokens",
  type: "base",
  fields: [
    { name: "email", type: "text", required: true },
    { name: "tokenHash", type: "text", required: true },
    { name: "expiresAt", type: "date", required: true },
    { name: "usedAt", type: "date" },
  ],
  indexes: [
    "CREATE UNIQUE INDEX `idx_customer_activation_token_hash` ON `customer_activation_tokens` (`tokenHash`)",
    "CREATE INDEX `idx_customer_activation_email` ON `customer_activation_tokens` (`email`)",
  ],
});
