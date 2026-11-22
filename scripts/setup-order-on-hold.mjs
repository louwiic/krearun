import assert from "node:assert/strict";
import { backup, client, option } from "./crm-pocketbase.mjs";

const db = await client();
const path = "/collections/orders";
const schema = await db.request(path);
const fields = structuredClone(schema.fields);
const status = fields.find((field) => field.name === "status");
assert.equal(status?.type, "select", "Schéma de statut inattendu.");

if (status.values.includes("on_hold")) {
  console.log("Le statut En attente est disponible dans PocketBase.");
} else if (!process.argv.includes("--apply")) {
  console.log("Statut En attente à ajouter au schéma des commandes.");
} else {
  backup(option("--backup-dir"), "before-order-on-hold", schema);
  status.values.push("on_hold");
  await db.request(path, "PATCH", { fields });
  const updated = await db.request(path);
  assert.deepEqual(updated.fields.find((field) => field.name === "status").values, status.values);
  console.log("Statut En attente ajouté et vérifié dans PocketBase.");
}
