import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import { getOrders } from "@/lib/store";
import { formatDate, formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminCommandesPage() {
  const orders = await getOrders();

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-semibold">Commandes</h1>
      <p className="mb-8 mt-1 text-sm text-ink-soft">
        {orders.length} commande{orders.length > 1 ? "s" : ""} au total
      </p>

      {orders.length === 0 ? (
        <div className="rounded-blob bg-cream p-14 text-center shadow-soft">
          <p className="font-display text-xl">Aucune commande pour l'instant</p>
          <p className="mt-2 text-sm text-ink-soft">
            Dès qu'un client passera commande via Stripe, elle apparaîtra ici
            automatiquement (webhook). ✿
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-blob bg-cream shadow-soft">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-sand/70 text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-4 font-bold">N°</th>
                <th className="px-5 py-4 font-bold">Client</th>
                <th className="hidden px-5 py-4 font-bold md:table-cell">Date</th>
                <th className="px-5 py-4 font-bold">Total</th>
                <th className="px-5 py-4 font-bold">Statut</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-sand/40 last:border-0 hover:bg-linen/60">
                  <td className="px-5 py-4">
                    <Link href={`/admin/commandes/${o.id}`} className="font-bold text-terra hover:underline">
                      #{o.number}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold">{o.name || "—"}</p>
                    <p className="text-xs text-ink-faint">{o.email}</p>
                  </td>
                  <td className="hidden px-5 py-4 text-ink-soft md:table-cell">
                    {formatDate(o.createdAt)}
                  </td>
                  <td className="px-5 py-4 font-bold">{formatPrice(o.totalCents)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
