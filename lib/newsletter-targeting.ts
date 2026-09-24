import type { NewsletterContact, Order } from "./types";

export type RecipientMode = "test" | "all" | "recent" | "older" | "custom";

export function newsletterRecipients(
  contacts: NewsletterContact[],
  orders: Pick<Order, "email" | "orderedAt" | "status">[],
  mode: Exclude<RecipientMode, "test">,
  selected: string[] = [],
  now = new Date(),
): string[] {
  const cutoff = new Date(now);
  const day = cutoff.getDate();
  cutoff.setDate(1);
  cutoff.setMonth(cutoff.getMonth() - 1);
  const lastDay = new Date(cutoff.getFullYear(), cutoff.getMonth() + 1, 0).getDate();
  cutoff.setDate(Math.min(day, lastDay));
  const latest = new Map<string, number>();
  for (const order of orders) {
    if (order.status === "cancelled") continue;
    const email = order.email.trim().toLowerCase();
    const date = Date.parse(order.orderedAt);
    if (email && Number.isFinite(date) && date <= now.getTime()) {
      latest.set(email, Math.max(latest.get(email) ?? 0, date));
    }
  }
  const selectedSet = new Set(selected.map((email) => email.trim().toLowerCase()));
  return [...new Set(contacts.filter((contact) => !contact.ignored).map((contact) => contact.email.trim().toLowerCase()))]
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    .filter((email) => {
      if (mode === "all") return true;
      if (mode === "custom") return selectedSet.has(email);
      const date = latest.get(email);
      return date !== undefined && (mode === "recent" ? date >= cutoff.getTime() : date < cutoff.getTime());
    });
}
