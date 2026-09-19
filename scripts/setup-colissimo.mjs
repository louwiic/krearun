// node --env-file=.env scripts/setup-colissimo.mjs
import { client } from "./crm-pocketbase.mjs";
const db = await client();
const found = await db.request(`/collections?filter=${encodeURIComponent("name='colissimo_shipments'")}`);
if (found.items.length) {
  console.log("colissimo_shipments : collection déjà présente, aucune modification.");
} else {
  await db.request("/collections", "POST", {
    name: "colissimo_shipments", type: "base",
    listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
    fields: [
      { name: "orderId", type: "text", required: true, max: 15 },
      { name: "state", type: "select", required: true, maxSelect: 1, values: ["generating", "ready", "uncertain"] },
      { name: "productCode", type: "text", max: 10 },
      { name: "parcelNumber", type: "text", max: 30 },
      { name: "documents", type: "json", maxSize: 20000000 },
      { name: "rawResponse", type: "text", max: 20000000 },
      { name: "contentType", type: "text", max: 500 },
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_colissimo_order ON colissimo_shipments (orderId)"],
  });
  console.log("colissimo_shipments : stockage privé créé.");
}
