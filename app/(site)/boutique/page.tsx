import Link from "next/link";
import type { Metadata } from "next";
import ProductCard from "@/components/product/ProductCard";
import { getProducts } from "@/lib/store";
import { CATEGORIES, type Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "La boutique",
  description:
    "Tous nos objets imprimés en 3D : veilleuses, vases, accessoires de bureau et petites douceurs pour la maison.",
};

export default async function BoutiquePage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string }>;
}) {
  const { categorie } = await searchParams;
  const products = await getProducts();
  const valid = CATEGORIES.some((c) => c.value === categorie);
  const filtered = valid
    ? products.filter((p) => p.category === (categorie as Category))
    : products;
  const currentLabel = valid
    ? CATEGORIES.find((c) => c.value === categorie)!.label
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-9 sm:px-6 sm:py-14">
      <div className="mb-7 sm:mb-10">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-terra sm:text-xs sm:tracking-[0.18em]">
          La boutique
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
          {currentLabel ?? "Tous nos petits objets"}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft sm:text-base">
          Chaque pièce est imprimée à la commande dans notre atelier — comptez
          2 à 4 jours de fabrication, le temps que les couches se déposent en
          douceur.
        </p>
      </div>

      <div className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:mb-10 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        <Link
          href="/boutique"
          className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition-all sm:px-5 ${
            !valid
              ? "bg-ink text-cream"
              : "border border-sand bg-cream text-ink-soft hover:border-terra hover:text-terra"
          }`}
        >
          Tout
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={`/boutique?categorie=${c.value}`}
            className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition-all sm:px-5 ${
              categorie === c.value
                ? "bg-ink text-cream"
                : "border border-sand bg-cream text-ink-soft hover:border-terra hover:text-terra"
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-blob bg-cream px-8 py-20 text-center shadow-soft">
          <p className="font-display text-2xl">Rien par ici pour le moment</p>
          <p className="mt-2 text-ink-soft">
            L'imprimante chauffe, revenez bientôt ✿
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-8 sm:gap-y-12 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
