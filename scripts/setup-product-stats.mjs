// Provision private product-audience storage and daily aggregates.
// Usage: node scripts/setup-product-stats.mjs
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
const backup=mkdtempSync(join(tmpdir(),"krearun-product-stats-"));
async function ensure(payload){
 const existing=api("/collections?filter="+encodeURIComponent(`name='${payload.name}'`),"GET",undefined,token).items[0];
 if(existing){if(existing.listRule!==null||existing.viewRule!==null)throw new Error("Unexpected public analytics access");console.log(`${payload.name}: already exists`);return;}
 const created=api("/collections","POST",payload,token);
 writeFileSync(join(backup,`${payload.name}.json`),JSON.stringify(created,null,2),{mode:0o600});console.log(`${payload.name}: created`);
}
await ensure({name:"product_events",type:"base",listRule:null,viewRule:null,createRule:null,updateRule:null,deleteRule:null,
 fields:[{name:"eventId",type:"text",required:true,max:36},{name:"productId",type:"text",required:true,max:30},
 {name:"kind",type:"select",required:true,maxSelect:1,values:["impression","click","view"]},
 {name:"created",type:"autodate",onCreate:true,onUpdate:false}],
 indexes:["CREATE UNIQUE INDEX idx_product_event_id ON product_events (eventId)","CREATE INDEX idx_product_event_day ON product_events (created, productId, kind)"]});
await ensure({name:"product_daily_stats",type:"view",listRule:null,viewRule:null,
 viewQuery:`SELECT MIN(id) AS id,
 productId, strftime('%Y-%m-%d', created, '+4 hours') AS day,
 COUNT(CASE WHEN kind='impression' THEN 1 END) AS impressions,
 COUNT(CASE WHEN kind='click' THEN 1 END) AS clicks,
 COUNT(CASE WHEN kind='view' THEN 1 END) AS views
 FROM product_events GROUP BY productId, strftime('%Y-%m-%d', created, '+4 hours')`});
const stats=api("/collections/product_daily_stats/records?perPage=1&sort=day,productId","GET",undefined,token);
console.log(`Daily view ready: ${stats.totalItems} rows; backup: ${backup}`);
