import test from "node:test";
import assert from "node:assert/strict";
import { createJiti } from "jiti";
const jiti = createJiti(import.meta.url, { fsCache: false });
const { parseLetterConfiguration } = await jiti.import("../lib/custom-letter-settings.ts");
const { letterCheckoutParams } = await jiti.import("../lib/custom-letter-checkout.ts");
const { orderItemDetails } = await jiti.import("../lib/order-details.ts");

const config = { initial: "L", name: "Louise", height: 160, nameWidth: 115, position: 52, baseColor: "#d94665", nameColor: "#f4eee0" };
test("payment fixes price and quantity and preserves the manufacturing configuration", () => {
  const parsed = parseLetterConfiguration({ ...config, priceCents: 1, quantity: 99, thickness: 100 });
  assert.deepEqual(parsed, config);
  const session = letterCheckoutParams(parsed, 500, "https://krearun.re");
  assert.equal(session.line_items[0].price_data.unit_amount, 2500);
  assert.equal(session.line_items[0].quantity, 1);
  assert.equal(session.shipping_options[0].shipping_rate_data.fixed_amount.amount, 500);
  assert.deepEqual(JSON.parse(session.metadata.customLetter), config);
  assert.deepEqual(session.payment_method_types, ["card"]);
  assert.match(session.success_url, /letter=1/);
});
test("invalid configurations cannot reach payment", () => {
  for (const change of [{ name: "" }, { height: 500 }, { position: NaN }, { baseColor: "red<script>" }, { initial: "LL" }]) {
    assert.equal(parseLetterConfiguration({ ...config, ...change }), null);
  }
});
test("the admin order shows the dimensions needed to reproduce a purchased letter", () => {
  const details = orderItemDetails({ letterConfiguration: config, customName: config.name });
  assert.ok(details.some(d=>d.label==='Hauteur'&&d.value==='160 mm'));
  assert.ok(details.some(d=>d.label==='Position verticale'&&d.value==='52 %'));
  assert.ok(details.some(d=>d.label==='Initiale'&&d.value==='L'));
});
