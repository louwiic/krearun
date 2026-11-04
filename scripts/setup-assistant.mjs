// Provision only private collections. No provider keys, messages or business data are changed.
import { execFileSync } from "node:child_process";
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
const text = (name, max = 250, required = false) => ({ name, type: "text", max, required });
const json = name => ({ name, type: "json", maxSize: 80000 });
const created = { name: "created", type: "autodate", onCreate: true, onUpdate: false };
const specs = [
  { name: "assistant_runs", fields: [text("requestKey", 250, true), text("actor", 100, true), text("channel", 20, true), text("message", 3000), text("state", 30), json("result"), { name: "inputTokens", type: "number" }, { name: "outputTokens", type: "number" }, { name: "estimatedUsd", type: "number" }, created], indexes: ["CREATE UNIQUE INDEX idx_assistant_request ON assistant_runs (requestKey)", "CREATE INDEX idx_assistant_actor ON assistant_runs (actor, created)"] },
  { name: "assistant_actions", fields: [text("actor", 100, true), text("kind", 40, true), text("target", 30), text("summary", 6000), text("status", 30), text("expiresAt", 40), json("patch"), json("before"), text("result", 3000), created], indexes: ["CREATE INDEX idx_assistant_actions_actor ON assistant_actions (actor, created)"] },
  { name: "assistant_locks", fields: [text("key", 300, true), created], indexes: ["CREATE UNIQUE INDEX idx_assistant_lock ON assistant_locks (key)"] },
];
for (const spec of specs) {
  const existing = api(`/collections?filter=${encodeURIComponent(`name='${spec.name}'`)}`, "GET", undefined, token).items[0];
  const schema = existing || api("/collections", "POST", { ...spec, type: "base", listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null }, token);
  if (["listRule", "viewRule", "createRule", "updateRule", "deleteRule"].some(k => schema[k] !== null)) throw new Error(`Unsafe rules: ${spec.name}`);
  if (spec.fields.some(f => !schema.fields.some(v => v.name === f.name))) throw new Error(`Incomplete schema: ${spec.name}`);
  console.log(`${spec.name}: private, ready`);
}
