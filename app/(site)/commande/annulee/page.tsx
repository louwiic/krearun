import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Paiement annulé" };

export default function CommandeAnnuleePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blush/35 text-5xl">
        !
      </div>
      <h1 className="mt-8 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        Paiement annulé
      </h1>
      <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink-soft">
        Aucun paiement n&apos;a été encaissé. Votre panier reste disponible si vous
        souhaitez reprendre votre commande.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Link
          href="/boutique"
          className="rounded-full bg-terra px-8 py-4 text-sm font-bold text-cream transition-colors hover:bg-terra-deep"
        >
          Retourner à la boutique
        </Link>
        <Link
          href="/contact"
          className="rounded-full border border-sand bg-cream px-8 py-4 text-sm font-bold transition-colors hover:border-terra hover:text-terra"
        >
          Nous contacter
        </Link>
      </div>
    </div>
  );
}
