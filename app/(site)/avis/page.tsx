import type { Metadata } from "next";
import ReviewPicker from "@/components/product/ReviewPicker";
import { getProducts } from "@/lib/store";

export const metadata: Metadata = {
  title: "Donner votre avis",
  description: "Partagez votre expérience avec une création Krearun Studio.",
  alternates: { canonical: "/avis" },
};

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const products = (await getProducts()).filter((product) => product.active).map(({ id, name }) => ({ id, name }));
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-wide text-terra">Votre expérience</p>
      <h1 className="mt-2 font-display text-4xl font-semibold">Laisser un avis</h1>
      <p className="mb-8 mt-3 text-sm leading-relaxed text-ink-soft">Votre retour nous aide à améliorer nos créations. Il sera relu avant publication.</p>
      {products.length ? <ReviewPicker products={products} /> : <p>Aucun produit disponible pour le moment.</p>}
    </main>
  );
}
