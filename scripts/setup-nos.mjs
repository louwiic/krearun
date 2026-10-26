// Provision protected logo storage and a draft NOS product.
// Usage: node scripts/setup-nos.mjs
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
const backup = mkdtempSync(join(tmpdir(), "krearun-nos-2026-10-26-"));
const existingCollection = api("/collections?filter=" + encodeURIComponent("name='nos_logos'"), "GET", undefined, token).items[0];
if (!existingCollection) {
  const created = api("/collections", "POST", {
    name:"nos_logos", type:"base", listRule:null,viewRule:null,createRule:null,updateRule:null,deleteRule:null,
    fields:[{name:"image",type:"file",maxSelect:1,maxSize:20971520,mimeTypes:["image/png"],protected:true,required:true},
      {name:"created",type:"autodate",onCreate:true,onUpdate:false}],
  }, token);
  writeFileSync(join(backup,"nos-logos-schema.json"),JSON.stringify(created,null,2),{mode:0o600});
  console.log("Protected NOS logo collection created");
} else if (existingCollection.listRule !== null || existingCollection.viewRule !== null || !existingCollection.fields.find(f=>f.name === "image")?.protected) {
  throw new Error("Unexpected logo access rules; no changes applied");
}
const slug="porte-boisson-nos-500ml";
const existing=api("/collections/products/records?filter="+encodeURIComponent(`slug='${slug}'`),"GET",undefined,token).items[0];
if (existing) {
  writeFileSync(join(backup,"product-before.json"),JSON.stringify(existing,null,2),{mode:0o600});
  console.log(`NOS already exists: ${existing.id}; product unchanged`);
} else {
  const product=api("/collections/products/records","POST",{
    name:"Porte-boisson NOS 500 ml",slug,tagline:"L’esprit NOS, une touche à votre nom.",
    description:"Porte-boisson personnalisé pour canette de 500 ml, avec un corps au choix noir, rose ou blanc, un motif NOS en relief et une valve décorative dorée.\n\nAjoutez votre texte (60 caractères maximum) sous le motif NOS ou importez votre logo pour une création à votre image. La personnalisation est incluse dans le prix.\n\nImprimé en 3D dans notre atelier à La Réunion. Les fines lignes visibles sur la photo font partie de la texture de fabrication.\n\nVendu sans boisson. Il s’agit d’un porte-boisson décoratif, pas d’une bouteille de gaz. Poids emballé estimé : 185 g.",
    priceCents:2290,compareAtCents:0,category:"porte-boisson",images:["/products/nos/porte-boisson-nos-500ml.webp"],
    videoUrl:"",weightGrams:185,colors:[{name:"Noir",hex:"#171717"},{name:"Rose",hex:"#e66a9c"},{name:"Blanc",hex:"#ffffff"}],stock:0,
    featured:false,active:false,isNew:true,preorder:false,partnerShared:false,privateSale:false,
    namePersonalizationEnabled:true,namePersonalizationPriceCents:0,variants:[],quantityDiscounts:[],
  },token);
  writeFileSync(join(backup,"product-created.json"),JSON.stringify(product,null,2),{mode:0o600});
  console.log(`NOS draft created: ${product.id}`);
}
console.log(`Backup: ${backup}`);
