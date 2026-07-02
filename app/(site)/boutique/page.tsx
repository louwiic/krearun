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
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="mb-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-terra">
          La boutique
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {currentLabel ?? "Tous nos petits objets"}
        </h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          Chaque pièce est imprimée à la commande dans notre atelier — comptez
          2 à 4 jours de fabrication, le temps que les couches se déposent en
          douceur.
        </p>
      </div>

      <div className="mb-10 flex flex-wrap gap-2.5">
        <Link
          href="/boutique"
          className={`rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
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
            className={`rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
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
        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
