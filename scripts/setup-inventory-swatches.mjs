// Add an optional material-reference image to inventory swatches.
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
const schema = api("/collections/inventory_colors", "GET", undefined, token);
if (["listRule","viewRule","createRule","updateRule","deleteRule"].some(key=>schema[key]!==null)) throw new Error("Inventory collection must remain private");
if (!schema.fields.some(field=>field.name === "swatchImage")) {
  const updated = api(`/collections/${schema.id}`, "PATCH", {fields:[...schema.fields,{name:"swatchImage",type:"text",max:1000}]}, token);
  if (["listRule","viewRule","createRule","updateRule","deleteRule"].some(key=>updated[key]!==schema[key])) throw new Error("Access rules changed");
}
console.log("Optional inventory swatchImage field ready; access rules unchanged.");
