// Provision admin-only, protected manufacturing originals. No public file URL.
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
const products = api("/collections/products", "GET", undefined, token);
const list = api(`/collections?filter=${encodeURIComponent("name='product_print_files'")}`, "GET", undefined, token);
const schema = list.items[0] ?? api("/collections", "POST", {
  name: "product_print_files", type: "base", listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
  fields: [
    { name: "productId", type: "relation", required: true, collectionId: products.id, maxSelect: 1, cascadeDelete: false },
    { name: "file", type: "file", required: true, maxSelect: 1, maxSize: 104857600, mimeTypes: [], protected: true },
    { name: "originalName", type: "text", required: true, max: 240 },
    { name: "sha256", type: "text", required: true, min: 64, max: 64, pattern: "^[a-f0-9]{64}$" },
    { name: "sizeBytes", type: "number", required: true, onlyInt: true, min: 1, max: 104857600 },
    { name: "notes", type: "text", max: 10000 },
    { name: "sourceUrl", type: "url" },
    { name: "created", type: "autodate", onCreate: true, onUpdate: false },
    { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
  ], indexes: ["CREATE UNIQUE INDEX idx_product_print_sha ON product_print_files (productId, sha256)"],
}, token);
if (["listRule", "viewRule", "createRule", "updateRule", "deleteRule"].some(key => schema[key] !== null) || !schema.fields.find(f => f.name === "file")?.protected) throw new Error("Unsafe print-file collection rules");
console.log("Protected product_print_files collection ready; all access rules locked.");
