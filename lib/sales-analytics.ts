import type { Order, Product } from "./types";

export type SalesOrder = Pick<Order, "id" | "number" | "name" | "orderedAt" | "status" | "source" | "paymentStatus" | "totalCents" | "shippingCents" | "amountPaidCents"> & { customerKey: string; items: Pick<Order["items"][number], "productId" | "name" | "priceCents" | "quantity">[] };
export type SalesProduct = Pick<Product, "id" | "name">;
export type Period = "today" | "7d" | "30d" | "90d" | "month" | "lastMonth" | "year" | "all" | "custom";
export type SalesFilters = { from: string; to: string; product: string; source: string; payment: string; granularity: "auto" | "day" | "week" | "month" };
export const UNASSIGNED_PRODUCT = "__unassigned__";
const DAY = 86400000;
const money = (n: number) => Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
export function reunionDay(iso: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Indian/Reunion", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  return ["year", "month", "day"].map((part) => parts.find((p) => p.type === part)?.value).join("-");
}
export function validDay(day: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Date.parse(day)) && new Date(day).toISOString().slice(0, 10) === day;
}
export function shiftDay(day: string, amount: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + amount * DAY).toISOString().slice(0, 10);
}
export function dayCount(from: string, to: string): number { return Math.round((Date.parse(to) - Date.parse(from)) / DAY) + 1; }
export function periodRange(period: Period, today: string, earliest: string) {
  let from = today, to = today;
  if (["7d", "30d", "90d"].includes(period)) from = shiftDay(today, 1 - Number(period.slice(0, -1)));
  if (period === "month") from = `${today.slice(0, 7)}-01`;
  if (period === "lastMonth") { to = shiftDay(`${today.slice(0, 7)}-01`, -1); from = `${to.slice(0, 7)}-01`; }
  if (period === "year") from = `${today.slice(0, 4)}-01-01`;
  if (period === "all") from = earliest || today;
  return { from, to };
}
export function previousRange(from: string, to: string) {
  const days = dayCount(from, to);
  return { from: shiftDay(from, -days), to: shiftDay(from, -1) };
}
function productKey(item: SalesOrder["items"][number]) {
  return item.productId?.trim() || `name:${(item.name || "Article sans nom").trim().toLocaleLowerCase("fr")}`;
}
export function productOptions(orders: SalesOrder[], products: SalesProduct[]) {
  const names = new Map(products.map((p) => [p.id, p.name]));
  for (const order of orders) for (const item of order.items) {
    const key = productKey(item);
    if (!names.has(key)) names.set(key, item.name || "Article sans nom");
  }
  return [...names].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, "fr"));
}
// Allocate the final merchandise amount, including discounts, to known lines.
// Integer remainder allocation guarantees that product totals reconcile exactly.
function lines(order: SalesOrder) {
  const revenue = Math.max(0, money(order.totalCents) - money(order.shippingCents));
  const items = order.items.filter((i) => Number.isFinite(i.quantity) && i.quantity > 0 && Number.isFinite(i.priceCents) && i.priceCents >= 0);
  const gross = items.map((i) => money(i.priceCents * i.quantity));
  const sum = gross.reduce((a, b) => a + b, 0);
  if (!items.length || (sum === 0 && revenue > 0)) return [{ key: UNASSIGNED_PRODUCT, name: "Sans détail produit", quantity: 0, revenue, cash: cashFor(order, revenue) }];
  const allocated = gross.map((value) => sum ? Math.floor(revenue * value / sum) : 0);
  let remainder = revenue - allocated.reduce((a, b) => a + b, 0);
  const ranking = gross.map((value, index) => ({ index, fraction: sum ? revenue * value / sum - allocated[index] : 0 })).sort((a, b) => b.fraction - a.fraction);
  for (const { index } of ranking) { if (remainder-- <= 0) break; allocated[index]++; }
  const cashTotal = cashFor(order, revenue);
  const cash = allocated.map((value) => revenue ? Math.floor(cashTotal * value / revenue) : 0);
  let cashRemainder = cashTotal - cash.reduce((a, b) => a + b, 0);
  const cashRanking = allocated.map((value, index) => ({ index, fraction: revenue ? cashTotal * value / revenue - cash[index] : 0 })).filter(({ index }) => allocated[index] > 0).sort((a, b) => b.fraction - a.fraction);
  for (const { index } of cashRanking) { if (cashRemainder-- <= 0) break; cash[index]++; }
  return items.map((item, i) => ({ key: productKey(item), name: item.name || "Article sans nom", quantity: item.quantity, revenue: allocated[i], cash: cash[i] }));
}
function cashFor(order: SalesOrder, merchandise: number) {
  const total = money(order.totalCents);
  const paid = order.paymentStatus === "refunded" || order.paymentStatus === "unpaid" ? 0 : order.paymentStatus === "paid" ? total : Math.min(total, money(order.amountPaidCents));
  return total ? Math.round(paid * merchandise / total) : 0;
}
function bucketKey(day: string, granularity: "day" | "week" | "month") {
  if (granularity === "month") return `${day.slice(0, 7)}-01`;
  if (granularity === "week") return shiftDay(day, -((new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7));
  return day;
}
export type SalesRow = { key: string; name: string; quantity: number; orders: number; revenue: number; cash: number };
export function salesAnalytics(orders: SalesOrder[], products: SalesProduct[], filters: SalesFilters) {
  const rangeValid = validDay(filters.from) && validDay(filters.to) && filters.from <= filters.to && dayCount(filters.from, filters.to) <= 36600;
  const days = rangeValid ? dayCount(filters.from, filters.to) : 0;
  const granularity = filters.granularity === "auto" ? days <= 60 ? "day" : days <= 180 ? "week" : "month" : filters.granularity;
  const series = new Map<string, { day: string; revenue: number; cash: number; orders: number }>();
  if (rangeValid) for (let day = filters.from; day <= filters.to; day = shiftDay(day, 1)) {
    const key = bucketKey(day, granularity);
    if (!series.has(key)) series.set(key, { day: key, revenue: 0, cash: 0, orders: 0 });
  }
  const names = new Map(productOptions(orders, products).map((p) => [p.id, p.name]));
  const top = new Map<string, SalesRow>(), sources = new Map<string, { key: string; revenue: number; cash: number; orders: number }>();
  const statuses = new Map<string, number>(), customers = new Set<string>();
  const recent: (SalesOrder & { selectedRevenue: number })[] = [];
  let revenue = 0, cash = 0, count = 0, quantity = 0, cancelled = 0, refunded = 0, matched = 0, withoutDetails = 0, withoutDetailsRevenue = 0, paidOrders = 0;
  for (const order of orders) {
    const day = reunionDay(order.orderedAt);
    if (!rangeValid || !day || day < filters.from || day > filters.to || (filters.source && order.source !== filters.source) || (filters.payment && order.paymentStatus !== filters.payment)) continue;
    const allLines = lines(order);
    const selected = filters.product ? allLines.filter((line) => line.key === filters.product) : allLines;
    if (!selected.length) continue;
    matched++;
    statuses.set(order.status, (statuses.get(order.status) || 0) + 1);
    if (order.status === "cancelled") { cancelled++; continue; }
    if (order.paymentStatus === "refunded") { refunded++; continue; }
    count++;
    const orderRevenue = selected.reduce((n, l) => n + l.revenue, 0), orderCash = selected.reduce((n, l) => n + l.cash, 0);
    revenue += orderRevenue; cash += orderCash;
    if (orderCash > 0) paidOrders++;
    if (order.customerKey) customers.add(order.customerKey);
    if (selected.some((line) => line.key === UNASSIGNED_PRODUCT)) { withoutDetails++; withoutDetailsRevenue += orderRevenue; }
    const bucket = series.get(bucketKey(day, granularity))!;
    bucket.revenue += orderRevenue; bucket.cash += orderCash; bucket.orders++;
    const source = sources.get(order.source) || { key: order.source, revenue: 0, cash: 0, orders: 0 };
    source.revenue += orderRevenue; source.cash += orderCash; source.orders++; sources.set(order.source, source);
    const seen = new Set<string>();
    for (const line of selected) {
      if (line.key === UNASSIGNED_PRODUCT) continue;
      quantity += line.quantity;
      const row = top.get(line.key) || { key: line.key, name: names.get(line.key) || line.name, quantity: 0, orders: 0, revenue: 0, cash: 0 };
      row.quantity += line.quantity; row.revenue += line.revenue; row.cash += line.cash;
      if (!seen.has(line.key)) row.orders++;
      seen.add(line.key); top.set(line.key, row);
    }
    recent.push({ ...order, selectedRevenue: orderRevenue });
  }
  return { rangeValid, granularity, days, revenue, cash, count, quantity, cancelled, refunded, matched, withoutDetails, withoutDetailsRevenue, paidOrders,
    customers: customers.size, average: count ? Math.round(revenue / count) : 0, outstanding: Math.max(0, revenue - cash),
    cancellationRate: matched ? cancelled / matched * 100 : 0,
    series: [...series.values()], products: [...top.values()], sources: [...sources.values()], statuses: [...statuses].map(([key, count]) => ({ key, count })),
    recent: recent.sort((a, b) => b.orderedAt.localeCompare(a.orderedAt)).slice(0, 6),
  };
}
