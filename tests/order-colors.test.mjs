import test from "node:test";
import assert from "node:assert/strict";
import { resolveOrderColor } from "../lib/order-colors.ts";

const item = { productId: "holder", variantId: "large" };
const catalog = {
  inventory: [{ name: "PLA Bleu Galaxy", hex: "#14253f" }, { name: "Bleu", hex: "#0000ff" }],
  products: { holder: {
    colors: [{ name: "Bleu", hex: "#112233" }],
    variants: { large: [{ name: "Bleu", hex: "#223344" }] },
  } },
};

test("variant colors take precedence over product and inventory colors", () => {
  assert.deepEqual(resolveOrderColor("bleu", item, catalog), ["#223344"]);
  assert.deepEqual(resolveOrderColor("bleu", { productId: "holder" }, catalog), ["#112233"]);
});
test("customized products resolve inventory names regardless of case and PLA prefix", () => {
  assert.deepEqual(resolveOrderColor("bleu galaxy", { productId: "clicker-studio" }, catalog), ["#14253f"]);
});
test("hexadecimal colors and multiple colors remain visible", () => {
  assert.deepEqual(resolveOrderColor("#abcdef", item), ["#abcdef"]);
  assert.deepEqual(resolveOrderColor("Noir & Blanc", item), ["#171717", "#ffffff"]);
  assert.deepEqual(resolveOrderColor("Teinte inconnue", item), [null]);
});

test("editing an order color preserves personalization and prices and rejects unknown colors", async () => {
  const { orderItemColorChoices, updateOrderItemColors } = await import('../lib/order-colors.ts');
  const original = { ...item, color: 'Ancien coloris', customName: 'Test', priceCents: 1990, quantity: 2, keychainChoice: 'griffes' };
  assert.ok(orderItemColorChoices(original, catalog).includes('Ancien coloris'));
  const form = new FormData();
  assert.equal(updateOrderItemColors([original], form, catalog)[0], original);
  form.set('itemColor_0', 'Bleu');
  assert.deepEqual(updateOrderItemColors([original], form, catalog), [{...original, color:'Bleu'}]);
  form.set('itemColor_0', 'inventée');
  assert.throws(() => updateOrderItemColors([original], form, catalog), /Coloris invalide/);
});
