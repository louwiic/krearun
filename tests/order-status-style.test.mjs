import test from "node:test";
import assert from "node:assert/strict";
import {
  PRODUCTION_STATUSES,
  PAYMENT_STATUSES,
} from "../lib/order-management.ts";
import {
  productionStatusStyle,
  paymentStatusStyle,
} from "../lib/order-status-style.ts";

test("each production and payment status has a readable background, border and text color", () => {
  const colors = PRODUCTION_STATUSES.map((status) =>
    productionStatusStyle(status.value),
  );
  assert.equal(new Set(colors).size, PRODUCTION_STATUSES.length);
  for (const color of [
    ...colors,
    ...PAYMENT_STATUSES.map((status) => paymentStatusStyle(status.value)),
  ]) {
    assert.match(color, /\bbg-\w+-100\b/);
    assert.match(color, /\bborder-\w+-300\b/);
    assert.match(color, /\btext-\w+-(950|800)\b/);
  }
  assert.match(productionStatusStyle("pending"), /bg-amber-100/);
  assert.match(productionStatusStyle("preparing"), /bg-sky-100/);
  assert.match(productionStatusStyle("ready"), /bg-violet-100/);
  assert.match(productionStatusStyle("delivered"), /bg-emerald-100/);
  assert.match(paymentStatusStyle("unpaid"), /bg-rose-100/);
  assert.match(paymentStatusStyle("paid"), /bg-emerald-100/);
});

test("payment colors stay independent from production, with a safe unknown-status fallback", () => {
  assert.equal(productionStatusStyle("paid"), productionStatusStyle("pending"));
  assert.notEqual(productionStatusStyle("paid"), paymentStatusStyle("paid"));
  assert.match(productionStatusStyle("unknown"), /bg-slate-100/);
  assert.match(paymentStatusStyle("unknown"), /bg-slate-100/);
});
