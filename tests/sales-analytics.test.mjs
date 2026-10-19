import test from "node:test";
import assert from "node:assert/strict";
import { reunionDay, validDay, periodRange, previousRange, productOptions, salesAnalytics, UNASSIGNED_PRODUCT } from "../lib/sales-analytics.ts";

const products = [{ id: "a", name: "Monster" }, { id: "b", name: "Red Bull" }];
const filters = { from: "2026-10-01", to: "2026-10-31", product: "", source: "", payment: "", granularity: "auto" };
function order(patch = {}) {
  return { id: "o1", number: 1, name: "Client", customerKey: "customer1", orderedAt: "2026-10-10T10:00:00Z", status: "delivered", source: "web", paymentStatus: "paid", totalCents: 3500, shippingCents: 500, amountPaidCents: 3500,
    items: [{ productId: "a", name: "Monster", quantity: 2, priceCents: 1000 }, { productId: "b", name: "Red Bull", quantity: 1, priceCents: 1000 }], ...patch };
}

test("inclusive Reunion dates cross UTC midnight correctly; periods and leap months compare equal durations", () => {
  assert.equal(reunionDay("2026-09-30T20:00:00Z"), "2026-10-01");
  assert.equal(reunionDay("2026-09-30T19:59:59Z"), "2026-09-30");
  assert.equal(reunionDay("bad"), "");
  assert.equal(validDay("2026-02-30"), false); assert.equal(validDay("2024-02-29"), true);
  assert.deepEqual(periodRange("7d", "2026-10-19", "2024-01-01"), { from: "2026-10-13", to: "2026-10-19" });
  assert.deepEqual(periodRange("lastMonth", "2024-03-05", "2024-01-01"), { from: "2024-02-01", to: "2024-02-29" });
  assert.deepEqual(previousRange("2026-10-13", "2026-10-19"), { from: "2026-10-06", to: "2026-10-12" });
  const result = salesAnalytics([order({ orderedAt: "2026-09-30T20:00:00Z" }), order({ id: "last", orderedAt: "2026-10-31T19:59:59Z" }), order({ id: "late", orderedAt: "2026-10-31T20:00:00Z" })], products, filters);
  assert.equal(result.count, 2); assert.equal(result.series.length, 31); assert.equal(result.series[0].orders, 1); assert.equal(result.series.at(-1).orders, 1);
});

test("cancelled and refunded orders never inflate revenue, quantities, cash or customers", () => {
  const result = salesAnalytics([order(), order({ id: "cancel", status: "cancelled", customerKey: "other" }), order({ id: "refund", paymentStatus: "refunded", customerKey: "third" })], products, filters);
  assert.equal(result.count, 1); assert.equal(result.revenue, 3000); assert.equal(result.cash, 3000); assert.equal(result.quantity, 3); assert.equal(result.customers, 1);
  assert.equal(result.cancelled, 1); assert.equal(result.refunded, 1); assert.equal(result.matched, 3);
  assert.equal(result.sources[0].orders, 1); assert.equal(result.products[0].orders, 1);
});

test("discounts and deposits allocate net product amounts without charging shipping or the whole basket to a product", () => {
  const input = order({ totalCents: 2900, amountPaidCents: 1450, paymentStatus: "deposit" });
  const all = salesAnalytics([input], products, filters);
  assert.equal(all.revenue, 2400); assert.equal(all.cash, 1200); assert.equal(all.outstanding, 1200); assert.equal(all.average, 2400);
  const a = salesAnalytics([input], products, { ...filters, product: "a" });
  const b = salesAnalytics([input], products, { ...filters, product: "b" });
  assert.equal(a.count, 1); assert.equal(a.quantity, 2); assert.equal(a.revenue, 1600); assert.equal(a.cash, 800);
  assert.equal(a.revenue + b.revenue, all.revenue); assert.equal(a.cash + b.cash, all.cash);
});

test("rounding reconciles to the cent and never assigns a deposit to a free item", () => {
  const input = order({ totalCents: 2, shippingCents: 0, amountPaidCents: 1, paymentStatus: "deposit", items: [
    { productId: "free", name: "Gratuit", quantity: 1, priceCents: 0 },
    { productId: "a", name: "A", quantity: 1, priceCents: 1 }, { productId: "b", name: "B", quantity: 1, priceCents: 1 },
  ] });
  const result = salesAnalytics([input], products, filters);
  assert.equal(result.products.reduce((sum, p) => sum + p.revenue, 0), 2);
  assert.equal(result.products.reduce((sum, p) => sum + p.cash, 0), 1);
  assert.equal(result.products.find((p) => p.key === "free").cash, 0);
});

test("historical orders without line details contribute to totals but never fabricate quantities or bestsellers", () => {
  const input = order({ items: [], source: "crm_std" });
  const all = salesAnalytics([input], products, filters);
  assert.equal(all.revenue, 3000); assert.equal(all.withoutDetails, 1); assert.equal(all.withoutDetailsRevenue, 3000); assert.equal(all.quantity, 0); assert.deepEqual(all.products, []);
  assert.equal(salesAnalytics([input], products, { ...filters, product: "a" }).count, 0);
  assert.equal(salesAnalytics([input], products, { ...filters, product: UNASSIGNED_PRODUCT }).count, 1);
});

test("source/payment/product filters combine, repeated product lines count one order, customer keys deduplicate", () => {
  const first = order({ items: [order().items[0], order().items[0]] });
  const result = salesAnalytics([first, order({ id: "two" }), order({ id: "manual", source: "manual" })], products, { ...filters, source: "web", payment: "paid", product: "a" });
  assert.equal(result.count, 2); assert.equal(result.customers, 1); assert.equal(result.products[0].orders, 2); assert.equal(result.quantity, 6);
  assert.equal(salesAnalytics([first], products, { ...filters, payment: "deposit" }).count, 0);
});

test("empty/invalid ranges remain finite, zero-fill timeline buckets, and weekly/monthly totals reconcile", () => {
  const empty = salesAnalytics([], products, filters);
  assert.equal(empty.average, 0); assert.equal(empty.cancellationRate, 0); assert.equal(empty.series.length, 31); assert.equal(empty.cash, 0);
  for (const granularity of ["day", "week", "month"]) {
    const result = salesAnalytics([order()], products, { ...filters, granularity });
    assert.equal(result.series.reduce((sum, p) => sum + p.revenue, 0), result.revenue);
    assert.equal(result.series.reduce((sum, p) => sum + p.orders, 0), 1);
  }
  for (const range of [{ from: "", to: "2026-10-10" }, { from: "2026-10-10", to: "2026-10-01" }]) {
    const result = salesAnalytics([order()], products, { ...filters, ...range }); assert.equal(result.rangeValid, false); assert.equal(result.count, 0); assert.equal(result.series.length, 0);
  }
});

test("deleted/custom products with no catalog match stay available as filters by stable ID or name", () => {
  const orders = [order({ items: [{ productId: "", name: "Lettre personnalisée", quantity: 1, priceCents: 3000 }] })];
  const option = productOptions(orders, products).find((p) => p.name === "Lettre personnalisée"); assert.ok(option);
  assert.equal(salesAnalytics(orders, products, { ...filters, product: option.id }).count, 1);
});
