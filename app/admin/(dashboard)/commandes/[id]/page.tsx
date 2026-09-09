import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import StatusBadge from "@/components/admin/StatusBadge";
import { updateOrderStatusAction } from "@/app/admin/actions";
import { getOrderById } from "@/lib/store";
import { formatDate, formatPrice } from "@/lib/format";
import { ORDER_SOURCES, PAYMENT_STATUSES, PRODUCTION_STATUSES, productionStatus, remainingCents } from "@/lib/order-management";

export const dynamic = "force-dynamic";

export default async function CommandeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!(await isAdmin())) redirect("/admin/login");
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
        <Link href={`/admin/commandes/${order.id}/modifier`} className="ml-auto rounded-full border border-sand px-4 py-2 text-sm font-semibold hover:bg-cream">Modifier la commande</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-blob bg-cream p-7 shadow-soft">
            <h2 className="mb-5 font-display text-lg font-semibold">Articles</h2>
            {order.description && <p className="mb-4 whitespace-pre-line text-sm">{order.description}</p>}
            {order.quantityText && <p className="mb-4 text-sm font-semibold">Quantité : {order.quantityText}</p>}
            <ul className="divide-y divide-sand/50">
              {order.items.map((item, i) => (
                <li key={i} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  {item.image && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={item.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-bold">{item.name}</p>
                    {item.variantName && <p className="text-xs text-ink-soft">Modèle : {item.variantName}</p>}
                    {item.keychainChoice && (
                      <p className="text-xs font-semibold text-terra-deep">
                        Porte-clés offert : choix {item.keychainChoice}
                      </p>
                    )}
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
            {order.note && (
              <div className="mt-5 rounded-2xl bg-linen p-4 text-sm leading-relaxed text-ink-soft">
                <p className="mb-2 font-bold text-ink">Note de commande</p>
                <p className="whitespace-pre-line">{order.note}</p>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-blob bg-cream p-7 shadow-soft">
            <h2 className="mb-4 font-display text-lg font-semibold">Paiement</h2>
            <p className="mb-3 text-sm font-bold">{PAYMENT_STATUSES.find(status => status.value === order.paymentStatus)?.label}</p>
            <dl className="space-y-2 text-sm"><div className="flex justify-between"><dt>Encaissé</dt><dd>{formatPrice(order.amountPaidCents)}</dd></div><div className="flex justify-between font-bold"><dt>Reste à payer</dt><dd>{formatPrice(remainingCents(order))}</dd></div></dl>
          </section>
          <section className="rounded-blob bg-cream p-7 shadow-soft">
            <h2 className="mb-4 font-display text-lg font-semibold">Production</h2>
            <form action={updateOrderStatusAction} className="space-y-4">
              <input type="hidden" name="id" value={order.id} />
              <select
                name="status"
                defaultValue={productionStatus(order.status)}
                className="w-full rounded-2xl border border-sand bg-linen px-4 py-3 text-sm outline-none focus:border-terra"
              >
                {PRODUCTION_STATUSES.map((s) => (
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
              {order.email && <label className="flex items-start gap-2 text-xs text-ink-soft"><input type="checkbox" name="notifyCustomer" defaultChecked={order.source === "web"} /> Notifier le client en passant en « Expédiée » ou « Livrée ».</label>}
              <button
                type="submit"
                className="w-full rounded-full bg-ink py-3 text-sm font-bold text-cream transition-colors hover:bg-terra"
              >
                Mettre à jour
              </button>
              <p className="text-[11px] leading-relaxed text-ink-faint">
                Sans cette option, aucun e-mail n’est envoyé. Les modifications rapides dans la liste n’envoient jamais d’e-mail.
              </p>
            </form>
          </section>

          <section className="rounded-blob bg-cream p-7 text-sm shadow-soft">
            <h2 className="mb-4 font-display text-lg font-semibold">Détails</h2>
            <dl className="space-y-2 text-ink-soft">
              <div className="flex justify-between"><dt>Origine</dt><dd>{ORDER_SOURCES.find(source => source.value === order.source)?.label}</dd></div>
              <div className="flex justify-between">
                <dt>Passée le</dt>
                <dd className="font-semibold text-ink">{formatDate(order.orderedAt)}</dd>
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
          <section className="rounded-blob bg-cream p-7 text-sm shadow-soft">
            <h2 className="mb-4 font-display text-lg font-semibold">Suivi interne · privé</h2>
            {order.urgent && <p className="mb-2 font-bold text-terra-deep">Commande urgente</p>}
            {order.dueDate && <p className="mb-2">Date prévue : {formatDate(order.dueDate)}</p>}
            <p className="whitespace-pre-line">{order.internalNote || "Aucune note interne."}</p>
            {!!order.tags.length && <p className="mt-3 text-ink-soft">{order.tags.join(" · ")}</p>}
            {order.customerProfileUrl && <a href={order.customerProfileUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block text-terra underline">Profil client ↗</a>}
            {order.productUrl && <a href={order.productUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block text-terra underline">Produit / modèle ↗</a>}
          </section>
        </div>
      </div>
    </div>
  );
}
