import type { Metadata } from "next";
import { getOrderByNumberAndEmail } from "@/lib/store";
import { formatDate, formatPrice } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Suivre ma commande",
  description: "Où en est votre colis ? Entrez votre numéro de commande.",
};

const field =
  "w-full rounded-full border border-sand bg-cream px-5 py-3.5 text-sm outline-none transition-colors placeholder:text-ink-faint focus:border-terra";

const STEPS: { status: OrderStatus; label: string; icon: string; text: string }[] = [
  { status: "paid", label: "Commande reçue", icon: "✿", text: "Votre commande est bien arrivée dans notre atelier." },
  { status: "preparing", label: "En fabrication", icon: "🖨️", text: "L'imprimante ronronne : votre pièce naît couche par couche." },
  { status: "shipped", label: "En route", icon: "📦", text: "Emballée avec soin, votre commande voyage vers vous." },
  { status: "delivered", label: "Livrée", icon: "🏡", text: "Bienvenue à la maison ! On espère qu'elle vous plaît." },
];

function stepIndex(status: OrderStatus): number {
  const idx = STEPS.findIndex((s) => s.status === status);
  return idx === -1 ? 0 : idx; // pending → étape 1
}

function Timeline({ order }: { order: Order }) {
  if (order.status === "cancelled") {
    return (
      <div className="rounded-blob bg-cream p-8 text-center shadow-soft">
        <p className="font-display text-xl">Cette commande a été annulée</p>
        <p className="mt-2 text-sm text-ink-soft">
          Une question ? Écrivez-nous, on vous répond vite.
        </p>
      </div>
    );
  }

  const current = stepIndex(order.status);

  return (
    <div className="rounded-blob bg-cream p-8 shadow-soft sm:p-10">
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl font-semibold">
          Commande #{order.number}
        </h2>
        <span className="text-sm text-ink-soft">
          {formatPrice(order.totalCents)} · {formatDate(order.createdAt)}
        </span>
      </div>

      <ol className="space-y-0">
        {STEPS.map((step, i) => {
          const done = i <= current;
          const isCurrent = i === current;
          return (
            <li key={step.status} className="relative flex gap-5 pb-8 last:pb-0">
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={`absolute left-[21px] top-11 h-[calc(100%-2.75rem)] w-0.5 rounded ${
                    i < current ? "bg-sage" : "bg-sand"
                  }`}
                />
              )}
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg ${
                  done ? "bg-sage/30" : "bg-linen-deep opacity-50"
                } ${isCurrent ? "ring-2 ring-sage" : ""}`}
              >
                {step.icon}
              </span>
              <div className={done ? "" : "opacity-50"}>
                <p className="font-display font-semibold">
                  {step.label}
                  {isCurrent && (
                    <span className="ml-2 rounded-full bg-sage/25 px-2.5 py-0.5 text-[11px] font-bold text-sage-deep">
                      en ce moment
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-sm text-ink-soft">{step.text}</p>
                {step.status === "shipped" && done && order.trackingNumber && (
                  <a
                    href={`https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(order.trackingNumber)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block rounded-full bg-linen px-4 py-2 text-xs font-bold text-terra hover:bg-linen-deep"
                  >
                    Suivi transporteur : {order.trackingNumber} ↗
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <ul className="mt-8 space-y-1 border-t border-sand/60 pt-6 text-sm text-ink-soft">
        {order.items.map((item, i) => (
          <li key={i} className="flex justify-between">
            <span>
              {item.name}
              {item.color ? ` — ${item.color}` : ""} × {item.quantity}
            </span>
            <span>{formatPrice(item.priceCents * item.quantity)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function SuiviPage({
  searchParams,
}: {
  searchParams: Promise<{ commande?: string; email?: string }>;
}) {
  const { commande, email } = await searchParams;
  const number = parseInt(commande ?? "", 10);
  const hasQuery = Boolean(commande && email);
  const order =
    hasQuery && Number.isFinite(number) && email
      ? await getOrderByNumberAndEmail(number, email)
      : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-terra">
        Où en est mon colis ?
      </p>
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        Suivre ma commande
      </h1>
      <p className="mt-4 text-ink-soft">
        Entrez le numéro de commande (reçu par e-mail, il commence par #) et
        l'adresse e-mail utilisée lors de l'achat.
      </p>

      <form method="GET" className="mt-8 flex flex-col gap-3 sm:flex-row">
        <input
          name="commande"
          defaultValue={commande}
          required
          inputMode="numeric"
          placeholder="N° de commande, ex. 1001"
          className={field}
        />
        <input
          name="email"
          type="email"
          defaultValue={email}
          required
          placeholder="votre@email.fr"
          className={field}
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-terra px-8 py-3.5 text-sm font-bold text-cream transition-colors hover:bg-terra-deep"
        >
          Voir
        </button>
      </form>

      <div className="mt-10">
        {hasQuery && !order && (
          <div className="rounded-blob bg-blush/25 p-8 text-center">
            <p className="font-display text-lg">
              Aucune commande trouvée avec ces informations
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              Vérifiez le numéro et l'e-mail (celui utilisé au moment du
              paiement) — ou écrivez-nous, on la retrouvera ensemble.
            </p>
          </div>
        )}
        {order && <Timeline order={order} />}
      </div>
    </div>
  );
}
