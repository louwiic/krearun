// Update only NOS color choices and personalization copy.
// Usage: node scripts/update-nos-options.mjs
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
const backup = mkdtempSync(join(tmpdir(), "krearun-nos-options-"));
const product = api("/collections/products/records?filter=" + encodeURIComponent("slug='porte-boisson-nos-500ml'"), "GET", undefined, token).items[0];
if (!product) throw new Error("NOS product missing");
writeFileSync(join(backup,"product-before.json"), JSON.stringify(product,null,2),{mode:0o600});
const updated = api(`/collections/products/records/${product.id}`, "PATCH", {
  colors:[{name:"Noir",hex:"#171717"},{name:"Rose",hex:"#e66a9c"},{name:"Blanc",hex:"#ffffff"}],
  namePersonalizationEnabled:true,
  description:product.description.replace("avec un corps bleu,", "avec un corps au choix noir, rose ou blanc,").replace("Ajoutez votre prénom sous le motif NOS", "Ajoutez votre texte (60 caractères maximum) sous le motif NOS"),
}, token);
for (const key of ["stock","active","priceCents","weightGrams","namePersonalizationPriceCents"]) {
  if (updated[key] !== product[key]) throw new Error(`Unexpected change: ${key}`);
}
console.log(JSON.stringify({id:updated.id,colors:updated.colors.map(c=>c.name),priceCents:updated.priceCents,stock:updated.stock,active:updated.active,backup}));
