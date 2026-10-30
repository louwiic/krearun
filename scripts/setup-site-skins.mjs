// Add storefront appearance settings without changing the currently published skin.
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
const backup = mkdtempSync(join(tmpdir(), "krearun-site-skins-"));
const schema = api("/collections/settings", "GET", undefined, token);
writeFileSync(join(backup, "settings-schema-before.json"), JSON.stringify(schema, null, 2), { mode: 0o600 });
const records = api("/collections/settings/records?perPage=100", "GET", undefined, token);
writeFileSync(join(backup, "settings-before.json"), JSON.stringify(records, null, 2), { mode: 0o600 });
const fields = [...schema.fields];
if (!fields.some(field => field.name === "site_skin")) fields.push({ name: "site_skin", type: "select", maxSelect: 1, values: ["default", "halloween"] });
if (!fields.some(field => field.name === "site_skin_enabled")) fields.push({ name: "site_skin_enabled", type: "bool" });
if (fields.length !== schema.fields.length) api("/collections/settings", "PATCH", { fields }, token);
const saved = api("/collections/settings", "GET", undefined, token);
if (saved.fields.find(field => field.name === "site_skin")?.type !== "select" || saved.fields.find(field => field.name === "site_skin_enabled")?.type !== "bool") throw new Error("Unexpected skin settings schema");
console.log(`Skin settings ready; existing settings preserved. Backup: ${backup}`);
