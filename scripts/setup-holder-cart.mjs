import assert from "node:assert/strict";
import sharp from "sharp";
import { client, option } from "./crm-pocketbase.mjs";

const db = await client();
const name = "holder_checkout_locks";
const schemaFilter = encodeURIComponent(`name='${name}'`);
let { items: [schema] } = await db.request(`/collections?filter=${schemaFilter}`);
if (!schema) {
  schema = await db.request("/collections", "POST", {
    name, type: "base",
    listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
    fields: [
      { name: "requestId", type: "text", required: true, max: 15 },
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_holder_checkout_lock ON holder_checkout_locks (requestId)"],
  });
}
assert.ok(schema.indexes.some(index => index.includes("idx_holder_checkout_lock")));
assert.ok(["listRule", "viewRule", "createRule", "updateRule", "deleteRule"].every(rule => schema[rule] === null));
console.log("Verrous privés de paiement vérifiés.");

const email = option("--demo-email").trim().toLowerCase();
if (email) {
  assert.match(email, /^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i);
  const { items: [customer] } = await db.request(`/collections/customers/records?perPage=1&filter=${encodeURIComponent(`email='${email}'`)}`);
  if (!customer) throw new Error("Compte client introuvable.");
  const submissionKey = "demo-mixed-cart-v1";
  const requests = "/collections/holder_requests/records";
  let { items: [request] } = await db.request(`${requests}?perPage=1&filter=${encodeURIComponent(`submissionKey='${submissionKey}'`)}`);
  if (!request) {
    const logo = await sharp("public/brand/krearun-badge.webp").resize(320, 320, { fit: "inside" }).png().toBuffer();
    const form = new FormData();
    const fields = {
      customerId: customer.id, customerEmail: customer.email, customerName: customer.name,
      quantity: 1, submissionKey, note: "Démonstration du panier mixte. Création fictive, sans fabrication ni encaissement.",
      configuration: JSON.stringify({ model: "custom", bodyColor: "#151515", bodyColorName: "Noir", logoWidth: 45, logoOffset: 0 }),
      palette: JSON.stringify(["#151515", "#ffffff"]),
    };
    for (const [key, value] of Object.entries(fields)) form.set(key, String(value));
    for (const key of ["logo", "originalLogo"]) form.set(key, new Blob([logo], { type: "image/png" }), "logo-demo-krearun.png");
    request = await db.request(requests, "POST", form);
  }
  assert.equal(request.customerId, customer.id, "Une démonstration existe déjà pour un autre compte.");
  assert.ok(!request.orderId && !request.stripeSessionId);
  const decisions = "/collections/holder_decisions/records";
  let { items: [decision] } = await db.request(`${decisions}?perPage=1&filter=${encodeURIComponent(`requestId='${request.id}'`)}`);
  decision ??= await db.request(decisions, "POST", {
    requestId: request.id, status: "approved", unitPriceCents: 0, shippingCents: 490,
    message: "Devis fictif pour tester l’ajout d’une création validée au panier.",
  });
  assert.equal(decision.status, "approved");
  assert.equal(decision.unitPriceCents, 0);
  console.log(`Demande de démonstration validée et sans paiement : ${request.id}`);
}
