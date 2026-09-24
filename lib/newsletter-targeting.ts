import type { NewsletterContact, Order } from "./types";

export type RecipientMode = "test" | "all" | "recent" | "older" | "custom";
export type MailingContact = {
  email: string;
  newsletterId: string;
  subscribed: boolean;
  ignored: boolean;
  createdAt: string;
  lastOrderAt: string | null;
};

export function mailingContacts(
  newsletterRecords: NewsletterContact[],
  orders: Pick<Order, "email" | "orderedAt" | "status">[],
): MailingContact[] {
  const contacts = new Map<string, MailingContact>();
  for (const record of newsletterRecords) {
    const email = record.email.trim().toLowerCase();
    if (!email) continue;
    contacts.set(email, {
      email,
      newsletterId: record.id,
      subscribed: record.source !== "customer",
      ignored: record.ignored,
      createdAt: record.createdAt,
      lastOrderAt: null,
    });
  }
  for (const order of orders) {
    if (order.status === "cancelled") continue;
    const email = order.email.trim().toLowerCase();
    if (!email) continue;
    const current = contacts.get(email) ?? {
      email, newsletterId: "", subscribed: false, ignored: false,
      createdAt: "", lastOrderAt: null,
    };
    const date = Date.parse(order.orderedAt);
    if (Number.isFinite(date) && (!current.lastOrderAt || date > Date.parse(current.lastOrderAt))) {
      current.lastOrderAt = order.orderedAt;
    }
    contacts.set(email, current);
  }
  return [...contacts.values()].filter(({ email }) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}

export function newsletterRecipients(
  contacts: MailingContact[],
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
  const selectedSet = new Set(selected.map((email) => email.trim().toLowerCase()));
  return contacts.filter((contact) => !contact.ignored).filter((contact) => {
    if (mode === "all") return true;
    if (mode === "custom") return selectedSet.has(contact.email);
    const date = contact.lastOrderAt ? Date.parse(contact.lastOrderAt) : NaN;
    return Number.isFinite(date) && date <= now.getTime() &&
      (mode === "recent" ? date >= cutoff.getTime() : date < cutoff.getTime());
  }).map((contact) => contact.email);
}
