import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notre atelier",
  description:
    "L'histoire de Krearun Studio : un petit atelier familial d'impression 3D, des objets doux fabriqués lentement et à la commande.",
};

export default function AProposPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-terra">
        Notre histoire
      </p>
      <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        Un petit studio, deux imprimantes,
        <br />
        et l'envie de faire doucement.
      </h1>

      <div className="mt-10 rotate-1 overflow-hidden rounded-[2.5rem] border-8 border-cream shadow-lifted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/products/atelier.svg"
          alt="L'atelier Krearun Studio"
          className="aspect-video w-full object-cover"
        />
      </div>

      <div className="prose-krearun mt-12 space-y-6 leading-relaxed text-ink-soft">
        <p>
          Tout a commencé un dimanche pluvieux, avec une première bobine de
          filament crème et l'envie de fabriquer une veilleuse pour la chambre
          de notre fille. La lune a mis quatorze heures à s'imprimer. On l'a
          regardée grandir couche par couche, et quelque chose s'est allumé —
          bien avant l'ampoule.
        </p>
        <p>
          Depuis, notre salon est devenu un petit atelier. Deux imprimantes y
          ronronnent presque tous les jours, entourées de bobines aux couleurs
          de saison : crème, sauge, blush, terracotta. On dessine chaque objet
          nous-mêmes, on le teste longtemps, puis on l'imprime{" "}
          <strong className="text-ink">uniquement à la commande</strong> — pas
          de stock qui dort, pas de gaspillage.
        </p>
        <p>
          Nos matières sont des PLA biosourcés, issus de la fécule de maïs.
          Chaque pièce est poncée et vérifiée à la main, puis emballée dans du
          papier de soie avec un petit mot écrit pour vous. Si vous trouvez une
          minuscule ligne d'impression en observant de près : c'est notre
          signature, celle des objets qui prennent leur temps.
        </p>
        <p>
          Merci d'être là. En choisissant Krearun Studio, vous soutenez une
          petite fabrication locale et lente — et ça, ça nous touche
          énormément.
        </p>
        <p className="font-display text-xl italic text-ink">
          — La petite famille de Krearun Studio ✿
        </p>
      </div>

      <div className="mt-14 flex flex-wrap gap-4">
        <Link
          href="/boutique"
          className="rounded-full bg-terra px-8 py-4 text-sm font-bold text-cream transition-colors hover:bg-terra-deep"
        >
          Découvrir nos objets
        </Link>
        <Link
          href="/contact"
          className="rounded-full border border-sand bg-cream px-8 py-4 text-sm font-bold transition-colors hover:border-terra hover:text-terra"
        >
          Nous écrire
        </Link>
      </div>
    </div>
  );
}
