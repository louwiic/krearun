import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hasFreeShipping, billableWeight, billableProductWeight, hasMissingBillableWeight, hasMissingProductWeight } from "../lib/free-shipping.ts";

const catalog = JSON.parse(readFileSync(new URL("../data/lunettes.json", import.meta.url)));
test("all six glasses have free shipping in cart and server checkout, even without a parcel weight", () => {
  assert.equal(catalog.length, 6);
  const items = catalog.map((item) => ({ ...item, weightGrams: 0, quantity: 2 }));
  assert.equal(billableWeight(items), 0);
  assert.equal(hasMissingBillableWeight(items), false);
  for (const item of items) {
    assert.equal(hasFreeShipping(item.slug), true);
    assert.equal(billableProductWeight(item, 2), 0);
    assert.equal(hasMissingProductWeight(item), false);
  }
});
test("a mixed basket still charges for the other products and existing free products stay free", () => {
  const glasses = { slug: catalog[0].slug, quantity: 3, weightGrams: 100 };
  const vase = { slug: "vase-test", quantity: 2, weightGrams: 250 };
  assert.equal(billableWeight([glasses, vase]), 500);
  assert.equal(billableProductWeight(vase, 2), 500);
  assert.equal(hasFreeShipping("porte-cle-coupe-du-monde-fifa"), true);
  assert.equal(hasFreeShipping("decapsuleur-a-levier"), true);
  assert.equal(hasFreeShipping("lunettes-inconnues"), false);
  assert.equal(hasMissingBillableWeight([glasses, { ...vase, weightGrams: 0 }]), true);
});
