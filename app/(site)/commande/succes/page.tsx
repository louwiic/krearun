import Link from "next/link";
import type { Metadata } from "next";
import ClearCart from "./ClearCart";
import { getOrderByStripeSession } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { getStripe, stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Merci pour votre commande" };

async function getStripeSessionSummary(sessionId: string) {
  if (!stripeConfigured()) return null;
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });
    return {
      customerEmail: session.customer_details?.email ?? session.customer_email ?? "",
      amountTotalCents: session.amount_total ?? 0,
      itemCount:
        session.line_items?.data.reduce(
          (count, line) => count + (line.quantity ?? 1),
          0
        ) ?? 0,
      paid: session.payment_status === "paid",
    };
  } catch {
    return null;
  }
}

export default async function SuccesPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const order = session_id ? await getOrderByStripeSession(session_id) : null;
  const stripeSummary = !order && session_id ? await getStripeSessionSummary(session_id) : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <ClearCart />
      <div className="mx-auto flex h-24 w-24 animate-float items-center justify-center rounded-full bg-sage/25 text-5xl">
        ✿
      </div>
      <h1 className="mt-8 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        Merci, du fond du cœur
      </h1>
      <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink-soft">
        Votre commande est bien arrivée dans notre atelier.
        {order && (
          <>
            {" "}
            Elle porte le doux numéro <strong className="text-ink">#{order.number}</strong>
            {" "}({formatPrice(order.totalCents)}).
          </>
        )}
        {!order && stripeSummary?.paid && (
          <>
            {" "}
            Le paiement est confirmé
            {stripeSummary.amountTotalCents > 0 ? ` (${formatPrice(stripeSummary.amountTotalCents)})` : ""}.
            La commande est en cours de synchronisation.
          </>
        )}{" "}
        L'imprimante va bientôt se mettre à ronronner — vous recevrez un e-mail
        à chaque étape, de la fabrication à la livraison.
      </p>

      {!order && stripeSummary?.paid && (
        <div className="mx-auto mt-8 max-w-md rounded-blob bg-sage/20 p-5 text-left text-sm text-ink-soft shadow-soft">
          <p className="font-bold text-sage-deep">Paiement Stripe confirmé</p>
          <p className="mt-2">
            {stripeSummary.itemCount > 0 && `${stripeSummary.itemCount} article(s) · `}
            {stripeSummary.customerEmail || "Adresse e-mail collectée par Stripe"}
          </p>
          <p className="mt-2">
            Si le numéro de commande n&apos;apparaît pas encore, rechargez cette page dans quelques secondes.
          </p>
        </div>
      )}

      <div className="mx-auto mt-10 max-w-md rounded-blob bg-cream p-8 text-left shadow-soft">
        <p className="font-display font-semibold">Et maintenant ?</p>
        <ol className="mt-4 space-y-3 text-sm text-ink-soft">
          <li className="flex gap-3"><span>1.</span> Nous imprimons votre objet, couche par couche (2 à 4 jours).</li>
          <li className="flex gap-3"><span>2.</span> Ponçage, vérification et emballage tout doux.</li>
          <li className="flex gap-3"><span>3.</span> Expédition suivie jusqu'à votre boîte aux lettres.</li>
        </ol>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        {order && (
          <Link
            href={`/suivi?commande=${order.number}&email=${encodeURIComponent(order.email)}`}
            className="rounded-full bg-terra px-8 py-4 text-sm font-bold text-cream transition-colors hover:bg-terra-deep"
          >
            Suivre ma commande
          </Link>
        )}
        <Link
          href="/boutique"
          className="rounded-full border border-sand bg-cream px-8 py-4 text-sm font-bold transition-colors hover:border-terra hover:text-terra"
        >
          Retourner flâner en boutique
        </Link>
      </div>
    </div>
  );
}
