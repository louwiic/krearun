import { getCustomers, getOrders } from "@/lib/store";
import { formatDate, formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  const [customers, orders] = await Promise.all([getCustomers(), getOrders()]);
  const stats = new Map<string, { count: number; spent: number }>();
  for (const order of orders) {
    const email = order.email.trim().toLowerCase();
    const current = stats.get(email) ?? { count: 0, spent: 0 };
    if (order.status !== "cancelled") { current.count += 1; current.spent += order.totalCents; }
    stats.set(email, current);
  }
  return <div className="mx-auto max-w-6xl"><h1 className="font-display text-3xl font-semibold">Clients</h1><p className="mb-8 mt-1 text-sm text-ink-soft">{customers.length} compte{customers.length !== 1 ? "s" : ""} client</p>{customers.length === 0 ? <div className="rounded-blob bg-cream p-14 text-center shadow-soft">Aucun compte client pour l'instant.</div> : <div className="overflow-x-auto rounded-blob bg-cream shadow-soft"><table className="w-full text-left text-sm"><thead><tr className="border-b border-sand/70 text-xs uppercase tracking-wide text-ink-faint"><th className="px-5 py-4">Client</th><th className="px-5 py-4">Contact</th><th className="px-5 py-4 text-center">Commandes</th><th className="px-5 py-4 text-right">Total dépensé</th><th className="px-5 py-4 text-right">Client depuis</th></tr></thead><tbody>{customers.map((customer) => { const customerStats = stats.get(customer.email.toLowerCase()) ?? { count: 0, spent: 0 }; return <tr key={customer.id} className="border-b border-sand/40 last:border-0"><td className="px-5 py-4"><p className="font-semibold">{customer.name || "—"}</p><p className="text-xs text-ink-faint">{customer.city || "—"}</p></td><td className="px-5 py-4"><a className="text-terra hover:underline" href={`mailto:${customer.email}`}>{customer.email}</a><p className="text-xs text-ink-faint">{customer.phone}</p></td><td className="px-5 py-4 text-center font-bold">{customerStats.count}</td><td className="px-5 py-4 text-right font-bold">{formatPrice(customerStats.spent)}</td><td className="px-5 py-4 text-right text-xs text-ink-soft">{formatDate(customer.createdAt)}</td></tr>; })}</tbody></table></div>}</div>;
}
