// Add the unlisted-offer flag without changing product records or access rules.
// Usage: node scripts/setup-private-sales.mjs
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import env from "@next/env";
env.loadEnvConfig(process.cwd());
const base = process.env.POCKETBASE_URL?.replace(/\/$/, "");
if (!base) throw new Error("Missing PocketBase URL");
function api(path, method = "GET", body, token) {
  const config = [`url = ${JSON.stringify(`${base}/api${path}`)}`, `request = "${method}"`, 'header = "Content-Type: application/json"'];
  if (token) config.push(`header = ${JSON.stringify(`Authorization: ${token}`)}`);
  if (body) config.push(`data = ${JSON.stringify(JSON.stringify(body))}`);
  return JSON.parse(execFileSync("curl", ["--fail-with-body", "--silent", "--show-error", "--config", "-"], { input: config.join("\n"), encoding: "utf8" }));
}
const { token } = api("/collections/_superusers/auth-with-password", "POST", { identity: process.env.POCKETBASE_ADMIN_EMAIL, password: process.env.POCKETBASE_ADMIN_PASSWORD });
if (!token) throw new Error("Authentication failed");
const schema = api("/collections/products", "GET", undefined, token);
const ruleKeys = ["listRule", "viewRule", "createRule", "updateRule", "deleteRule"];
if (schema.fields.some(field => field.name === "privateSale")) {
  console.log("privateSale already provisioned");
} else {
  const backup = mkdtempSync(join(tmpdir(), "krearun-private-sales-schema-"));
  writeFileSync(join(backup, "products-schema.json"), JSON.stringify(schema, null, 2), { mode: 0o600 });
  const updated = api(`/collections/${schema.id}`, "PATCH", { fields: [...schema.fields, { name: "privateSale", type: "bool", required: false }] }, token);
  if (!updated.fields.some(field => field.name === "privateSale" && field.type === "bool")) throw new Error("Field missing");
  if (ruleKeys.some(key => updated[key] !== schema[key])) throw new Error("Access rules changed unexpectedly");
  console.log(`privateSale provisioned; rules unchanged; backup: ${backup}`);
}
const publicRecords = api("/collections/products/records?perPage=1&filter=" + encodeURIComponent("active=true && privateSale=false"), "GET", undefined, token);
console.log(`Catalog filter valid: ${publicRecords.totalItems} public active products`);
