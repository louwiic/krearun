// Dry-run by default. Apply: node --env-file=.env scripts/setup-order-management.mjs --apply --backup-dir /private/backup
import assert from "node:assert/strict";
import { client, backup, option } from "./crm-pocketbase.mjs";

const db = await client();
const schema = await db.request("/collections/orders");
const before = await db.orders();
const fields = structuredClone(schema.fields);
const status = fields.find((field) => field.name === "status");
if (!status || status.type !== "select")
  throw new Error("Schéma de statut inattendu.");
if (!status.values.includes("ready")) status.values.push("ready");
const text = (name, max = 20000) => ({ name, type: "text", max });
const additions = [
  {
    name: "source",
    type: "select",
    maxSelect: 1,
    values: ["web", "manual", "crm_std", "csv"],
  },
  text("sourceId", 250),
  {
    name: "paymentStatus",
    type: "select",
    maxSelect: 1,
    values: ["unpaid", "deposit", "paid", "refunded"],
  },
  { name: "amountPaidCents", type: "number", min: 0, onlyInt: true },
  text("description"),
  text("quantityText", 500),
  text("internalNote"),
  text("customerProfileUrl", 2000),
  text("productUrl", 2000),
  { name: "tags", type: "json", maxSize: 100000 },
  { name: "legacyData", type: "json", maxSize: 1000000 },
  { name: "orderedAt", type: "date" },
  { name: "dueDate", type: "date" },
  { name: "urgent", type: "bool" },
];
for (const addition of additions) {
  const current = fields.find((field) => field.name === addition.name);
  if (!current) fields.push(addition);
  else if (current.type !== addition.type)
    throw new Error(`Type incompatible : ${addition.name}`);
}
const index =
  "CREATE UNIQUE INDEX idx_orders_crm_source ON orders (source, sourceId) WHERE sourceId != ''";
const indexes = [...schema.indexes];
if (!indexes.some((value) => value.includes("idx_orders_crm_source")))
  indexes.push(index);
console.log(
  JSON.stringify({
    mode: process.argv.includes("--apply") ? "apply" : "dry-run",
    existingOrders: before.length,
    addedFields: fields
      .filter((field) => !schema.fields.some((old) => old.name === field.name))
      .map((field) => field.name),
    ready: true,
  }),
);
if (process.argv.includes("--apply")) {
  backup(option("--backup-dir"), "before-order-schema", {
    schema,
    orders: before,
  });
  // Rules and unrelated fields/indexes are deliberately left intact.
  await db.request("/collections/orders", "PATCH", { fields, indexes });
  const verified = await db.request("/collections/orders");
  for (const key of [
    "listRule",
    "viewRule",
    "createRule",
    "updateRule",
    "deleteRule",
  ])
    assert.deepEqual(verified[key], schema[key]);
  assert.ok(
    verified.fields
      .find((field) => field.name === "status")
      .values.includes("ready"),
  );
  const after = await db.orders();
  for (const original of before) {
    const current = after.find((order) => order.id === original.id);
    assert.ok(current, "Une commande existante manque après migration.");
    for (const key of Object.keys(original))
      assert.deepEqual(
        current[key],
        original[key],
        `Champ existant modifié : ${key}`,
      );
  }
  console.log(
    `Schéma vérifié, ${before.length} commandes existantes inchangées.`,
  );
}
