// Provision private, consent-based purchase-journey analytics.
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
const list = api(`/collections?filter=${encodeURIComponent("name='purchase_events'")}`, "GET", undefined, token);
const schema = list.items[0] ?? api("/collections", "POST", {
  name: "purchase_events", type: "base", listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
  fields: [
    {name:"eventId",type:"text",required:true,max:36}, {name:"sessionId",type:"text",required:true,max:36},
    {name:"kind",type:"select",required:true,maxSelect:1,values:["visit","product_view","add_to_cart","cart_updated","view_cart","begin_checkout","checkout_error","payment_started"]},
    {name:"page",type:"text",max:40}, {name:"productId",type:"text",max:80}, {name:"checkoutId",type:"text",max:255},
    {name:"items",type:"json",maxSize:30000},
    {name:"created",type:"autodate",onCreate:true,onUpdate:false},
  ], indexes:["CREATE UNIQUE INDEX idx_purchase_event ON purchase_events (eventId)","CREATE INDEX idx_purchase_session ON purchase_events (sessionId)","CREATE INDEX idx_purchase_created ON purchase_events (created)"],
}, token);
if (!schema.fields.some(f=>f.name === "page")) api(`/collections/${schema.id}`, "PATCH", {fields:[...schema.fields,{name:"page",type:"text",max:40}]}, token);
if (["listRule","viewRule","createRule","updateRule","deleteRule"].some(k=>schema[k]!==null)) throw new Error("Unsafe purchase-event rules");
console.log("Private purchase_events collection ready; no contact fields; 30-day application retention.");
