import Link from "next/link";
import { notFound } from "next/navigation";
import StatusBadge from "@/components/admin/StatusBadge";
import { updateOrderStatusAction } from "@/app/admin/actions";
import { getOrderById } from "@/lib/store";
import { formatDate, formatPrice } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CommandeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/commandes" className="text-sm font-semibold text-ink-faint hover:text-terra">
        ← Retour aux commandes
      </Link>
      <div className="mb-8 mt-2 flex flex-wrap items-center gap-4">
        <h1 className="font-display text-3xl font-semibold">
          Commande #{order.number}
        </h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-blob bg-cream p-7 shadow-soft">
            <h2 className="mb-5 font-display text-lg font-semibold">Articles</h2>
            <ul className="divide-y divide-sand/50">
              {order.items.map((item, i) => (
                <li key={i} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  {item.image && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={item.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-bold">{item.name}</p>
                    {item.color && <p className="text-xs text-ink-soft">Coloris : {item.color}</p>}
                    {item.customName && (
                      <p className="text-xs font-semibold text-terra-deep">
                        Prénom : {item.customName}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-ink-soft">× {item.quantity}</p>
                  <p className="w-20 text-right text-sm font-bold">
                    {formatPrice(item.priceCents * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-5 space-y-2 border-t border-sand/60 pt-4 text-sm">
              <p className="flex justify-between text-ink-soft">
                <span>Sous-total</span> <span>{formatPrice(order.subtotalCents)}</span>
              </p>
              <p className="flex justify-between text-ink-soft">
                <span>Livraison</span>{" "}
                <span>{order.shippingCents === 0 ? "Offerte" : formatPrice(order.shippingCents)}</span>
              </p>
              <p className="flex justify-between font-display text-lg font-semibold">
                <span>Total</span> <span>{formatPrice(order.totalCents)}</span>
              </p>
            </div>
          </section>

          <section className="rounded-blob bg-cream p-7 shadow-soft">
            <h2 className="mb-4 font-display text-lg font-semibold">Livraison</h2>
            <address className="text-sm not-italic leading-relaxed text-ink-soft">
              <span className="font-bold text-ink">{order.name || "—"}</span>
              <br />
              {order.addressLine1}
              {order.addressLine2 && (
                <>
                  <br />
                  {order.addressLine2}
                </>
              )}
              <br />
              {order.postalCode} {order.city}, {order.country}
              <br />
              {order.email}
              {order.phone && (
                <>
                  <br />
                  {order.phone}
                </>
              )}
            </address>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-blob bg-cream p-7 shadow-soft">
            <h2 className="mb-4 font-display text-lg font-semibold">Statut</h2>
            <form action={updateOrderStatusAction} className="space-y-4">
              <input type="hidden" name="id" value={order.id} />
              <select
                name="status"
                defaultValue={order.status}
                className="w-full rounded-2xl border border-sand bg-linen px-4 py-3 text-sm outline-none focus:border-terra"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-soft">
                  N° de suivi colis
                </label>
                <input
                  name="trackingNumber"
                  defaultValue={order.trackingNumber}
                  placeholder="ex. 6A12345678901"
                  className="w-full rounded-2xl border border-sand bg-linen px-4 py-3 text-sm outline-none focus:border-terra"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-ink py-3 text-sm font-bold text-cream transition-colors hover:bg-terra"
              >
                Mettre à jour
              </button>
              <p className="text-[11px] leading-relaxed text-ink-faint">
                Passer en « Expédiée » envoie automatiquement l'e-mail avec le
                n° de suivi au client. « Livrée » envoie le petit mot de fin.
              </p>
            </form>
          </section>

          <section className="rounded-blob bg-cream p-7 text-sm shadow-soft">
            <h2 className="mb-4 font-display text-lg font-semibold">Détails</h2>
            <dl className="space-y-2 text-ink-soft">
              <div className="flex justify-between">
                <dt>Passée le</dt>
                <dd className="font-semibold text-ink">{formatDate(order.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Mise à jour</dt>
                <dd>{formatDate(order.updatedAt)}</dd>
              </div>
              {order.stripeSessionId && (
                <div className="pt-2">
                  <dt className="text-xs uppercase tracking-wide text-ink-faint">Session Stripe</dt>
                  <dd className="mt-1 break-all font-mono text-xs">{order.stripeSessionId}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
