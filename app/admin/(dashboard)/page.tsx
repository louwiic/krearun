import Link from "next/link";
import { createHash } from "node:crypto";
import SalesDashboard from "@/components/admin/SalesDashboard";
import { reunionDay, type SalesOrder } from "@/lib/sales-analytics";
import { getOrders, getProducts, getSubscribers, getLetterStats } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [orders, products, subscribers, letterStats] = await Promise.all([
    getOrders(),
    getProducts({ includeInactive: true }),
    getSubscribers(),
    getLetterStats(),
  ]);

  const paidOrders = orders.filter((o) => o.status !== "cancelled" && o.amountPaidCents > 0);
  const revenue = paidOrders.reduce((n, o) => n + o.amountPaidCents, 0);
  const toShip = orders.filter((o) => o.status === "paid" || o.status === "preparing" || o.status === "ready");
  const lowStock = products.filter((p) => p.active && !p.preorder && p.stock <= 3);
  const salesOrders: SalesOrder[] = orders.map((order) => ({
    id: order.id, number: order.number, name: order.name, orderedAt: order.orderedAt,
    status: order.status, source: order.source, paymentStatus: order.paymentStatus,
    totalCents: order.totalCents, shippingCents: order.shippingCents, amountPaidCents: order.amountPaidCents,
    customerKey: order.email.trim() ? createHash("sha256").update(`email:${order.email.trim().toLowerCase()}`).digest("hex")
      : order.phone.replace(/\D/g, "") ? createHash("sha256").update(`phone:${order.phone.replace(/\D/g, "")}`).digest("hex") : "",
    items: order.items.map(({ productId, name, priceCents, quantity }) => ({ productId, name, priceCents, quantity })),
  }));

  const stats = [
    { label: "Encaissé total avec livraison", value: formatPrice(revenue) },
    { label: "Commandes historiques", value: String(orders.length) },
    { label: "À préparer / remettre", value: String(toShip.length) },
    { label: "Abonnés newsletter", value: String(subscribers.length) },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="font-display text-3xl font-semibold">Tableau de bord</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Suivez vos ventes, vos encaissements et les produits qui se vendent le mieux.
      </p>

      {!stripeConfigured() && (
        <div className="mt-6 rounded-blob border border-blush bg-blush/20 p-5 text-sm">
          <p className="font-bold text-terra-deep">
            Paiements non configurés
          </p>
          <p className="mt-1 text-ink-soft">
            Ajoute tes clés Stripe dans le fichier <code className="rounded bg-cream px-1.5 py-0.5">.env</code>{" "}
            (STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
            STRIPE_WEBHOOK_SECRET) puis redémarre le serveur. Le guide complet
            est dans les <Link href="/admin/parametres" className="font-bold text-terra underline">réglages</Link>.
          </p>
        </div>
      )}

      <SalesDashboard orders={salesOrders} products={products.map(({ id, name }) => ({ id, name }))} today={reunionDay(new Date().toISOString())} />

      <Link href="/admin/produits/statistiques" className="mt-8 inline-flex rounded-full border border-ink px-5 py-3 text-sm font-bold">Voir les impressions, clics et vues des produits ↗</Link>

      <h2 className="mt-12 font-display text-2xl">Vue générale de la boutique</h2>
      <p className="mt-1 text-xs text-ink-soft">Tout l’historique · indépendant des filtres de ventes ci-dessus</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-blob bg-cream p-6 shadow-soft">
            <p className="mt-3 font-display text-2xl font-semibold">{s.value}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-10 border-y border-sand py-6" aria-label="Statistiques Lettre personnalisée">
        <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="font-display text-xl">Lettre personnalisée</h2><span className="text-xs text-ink-soft">Depuis l’activation · visiteurs par navigateur</span></div>
        {letterStats ? <>
          <dl className="mt-5 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {[
              ["Visiteurs uniques", letterStats.visitors],
              ["Clics sur le menu", letterStats.clicks],
              ["Visiteurs ayant interagi", letterStats.interactions],
              ["Téléchargements déclenchés", letterStats.downloads],
            ].map(([label, value]) => <div key={label}><dt className="text-xs text-ink-soft">{label}</dt><dd className="mt-1 text-2xl font-semibold">{value}</dd></div>)}
          </dl>
          <p className="mt-4 text-xs text-ink-soft">{letterStats.clickVisitors} visiteurs ont cliqué · {letterStats.downloadVisitors} visiteurs ont téléchargé · {letterStats.stl} STL · {letterStats.threeMf} 3MF</p>
        </> : <p role="status" className="mt-4 text-sm text-ink-soft">Statistiques temporairement indisponibles.</p>}
      </section>

      <div className="mt-10">
        <section>
          <h2 className="mb-4 font-display text-xl font-semibold">
            Stock bas
          </h2>
          {lowStock.length === 0 ? (
            <div className="rounded-blob bg-cream p-8 text-center text-sm text-ink-soft shadow-soft">
              Aucun stock bas à signaler.
            </div>
          ) : (
            <ul className="space-y-3">
              {lowStock.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/produits/${p.id}`}
                    className="flex items-center gap-3 rounded-2xl bg-cream px-4 py-3 shadow-soft transition-shadow hover:shadow-lifted"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.images[0]}
                      alt=""
                      className="h-10 w-10 rounded-xl object-cover"
                    />
                    <span className="flex-1 text-sm font-semibold">{p.name}</span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        p.stock === 0
                          ? "bg-blush/50 text-terra-deep"
                          : "bg-sand/60 text-ink-soft"
                      }`}
                    >
                      {p.stock} restant{p.stock > 1 ? "s" : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
