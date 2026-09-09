import type { Order, OrderStatus } from "./types";

const neutral = "border-slate-300 bg-slate-100 text-slate-800";

const productionStyles: Record<string, string> = {
  review: "border-orange-300 bg-orange-100 text-orange-950",
  pending: "border-amber-300 bg-amber-100 text-amber-950",
  preparing: "border-sky-300 bg-sky-100 text-sky-950",
  ready: "border-violet-300 bg-violet-100 text-violet-950",
  shipped: "border-teal-300 bg-teal-100 text-teal-950",
  delivered: "border-emerald-300 bg-emerald-100 text-emerald-950",
  cancelled: "border-rose-300 bg-rose-100 text-rose-950",
} satisfies Record<Exclude<OrderStatus, "paid">, string>;

const paymentStyles: Record<string, string> = {
  unpaid: "border-rose-300 bg-rose-100 text-rose-950",
  deposit: "border-amber-300 bg-amber-100 text-amber-950",
  paid: "border-emerald-300 bg-emerald-100 text-emerald-950",
  refunded: neutral,
} satisfies Record<Order["paymentStatus"], string>;

export function productionStatusStyle(status: string): string {
  // Historical web status "paid" means pending production, not finished work.
  return productionStyles[status === "paid" ? "pending" : status] ?? neutral;
}

export function paymentStatusStyle(status: string): string {
  return paymentStyles[status] ?? neutral;
}
