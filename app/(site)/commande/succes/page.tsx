import Link from "next/link";
import type { Metadata } from "next";
import ClearCart from "./ClearCart";
import { getOrderByStripeSession } from "@/lib/store";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Merci pour votre commande" };

export default async function SuccesPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const order = session_id ? await getOrderByStripeSession(session_id) : null;

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
        Votre commande est bien arrivée dans notre cocon.
        {order && (
          <>
            {" "}
            Elle porte le doux numéro <strong className="text-ink">#{order.number}</strong>
            {" "}({formatPrice(order.totalCents)}).
          </>
        )}{" "}
        L'imprimante va bientôt se mettre à ronronner — vous recevrez un e-mail
        à chaque étape, de la fabrication à la livraison.
      </p>

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
