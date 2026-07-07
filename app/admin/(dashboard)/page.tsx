import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import { getOrders, getProducts, getSubscribers } from "@/lib/store";
import { formatDate, formatPrice } from "@/lib/format";
import { stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [orders, products, subscribers] = await Promise.all([
    getOrders(),
    getProducts({ includeInactive: true }),
    getSubscribers(),
  ]);

  const paidOrders = orders.filter((o) => o.status !== "cancelled" && o.status !== "pending");
  const revenue = paidOrders.reduce((n, o) => n + o.totalCents, 0);
  const toShip = orders.filter((o) => o.status === "paid" || o.status === "preparing");
  const lowStock = products.filter((p) => p.active && !p.preorder && p.stock <= 3);
  const recent = orders.slice(0, 6);

  const stats = [
    { label: "Chiffre d'affaires", value: formatPrice(revenue), icon: "🌸" },
    { label: "Commandes", value: String(paidOrders.length), icon: "📦" },
    { label: "À expédier", value: String(toShip.length), icon: "🚚" },
    { label: "Abonnés newsletter", value: String(subscribers.length), icon: "💌" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-semibold">Tableau de bord</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Bonjour ! Voici la météo de la boutique aujourd'hui.
      </p>

      {!stripeConfigured() && (
        <div className="mt-6 rounded-blob border border-blush bg-blush/20 p-5 text-sm">
          <p className="font-bold text-terra-deep">
            ⚡ Paiements non configurés
          </p>
          <p className="mt-1 text-ink-soft">
            Ajoute tes clés Stripe dans le fichier <code className="rounded bg-cream px-1.5 py-0.5">.env</code>{" "}
            (STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
            STRIPE_WEBHOOK_SECRET) puis redémarre le serveur. Le guide complet
            est dans les <Link href="/admin/parametres" className="font-bold text-terra underline">réglages</Link>.
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-blob bg-cream p-6 shadow-soft">
            <span className="text-2xl">{s.icon}</span>
            <p className="mt-3 font-display text-2xl font-semibold">{s.value}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">
              Dernières commandes
            </h2>
            <Link
              href="/admin/commandes"
              className="text-xs font-bold text-terra hover:underline"
            >
              Tout voir →
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="rounded-blob bg-cream p-10 text-center text-sm text-ink-soft shadow-soft">
              Aucune commande pour le moment — elles apparaîtront ici dès le
              premier paiement. ✿
            </div>
          ) : (
            <ul className="space-y-3">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/commandes/${o.id}`}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-cream px-5 py-4 shadow-soft transition-shadow hover:shadow-lifted"
                  >
                    <div>
                      <p className="text-sm font-bold">
                        #{o.number} — {o.name || o.email}
                      </p>
                      <p className="text-xs text-ink-faint">{formatDate(o.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={o.status} />
                      <span className="text-sm font-bold">{formatPrice(o.totalCents)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-display text-xl font-semibold">
            Stock bas
          </h2>
          {lowStock.length === 0 ? (
            <div className="rounded-blob bg-cream p-8 text-center text-sm text-ink-soft shadow-soft">
              Tous les stocks respirent 🌿
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
