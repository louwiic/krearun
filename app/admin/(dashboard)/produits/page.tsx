import Link from "next/link";
import { getProducts } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { CATEGORIES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminProduitsPage() {
  const products = await getProducts({ includeInactive: true });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Produits</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {products.length} objet{products.length > 1 ? "s" : ""} au catalogue
          </p>
        </div>
        <Link
          href="/admin/produits/nouveau"
          className="rounded-full bg-terra px-6 py-3 text-sm font-bold text-cream transition-colors hover:bg-terra-deep"
        >
          + Nouvel objet
        </Link>
      </div>

      <div className="overflow-hidden rounded-blob bg-cream shadow-soft">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-sand/70 text-xs uppercase tracking-wide text-ink-faint">
              <th className="px-5 py-4 font-bold">Objet</th>
              <th className="hidden px-5 py-4 font-bold sm:table-cell">Catégorie</th>
              <th className="px-5 py-4 font-bold">Prix</th>
              <th className="px-5 py-4 font-bold">Stock</th>
              <th className="hidden px-5 py-4 font-bold md:table-cell">Statut</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-sand/40 last:border-0 hover:bg-linen/60">
                <td className="px-5 py-3">
                  <Link href={`/admin/produits/${p.id}`} className="flex items-center gap-3 font-semibold hover:text-terra">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.images[0] ?? "/products/hero.svg"} alt="" className="h-11 w-11 rounded-xl object-cover" />
                    <span>
                      {p.name}
                      {p.featured && <span className="ml-2" title="Coup de cœur">💛</span>}
                      {p.isNew && <span className="ml-1 rounded-full bg-sage/30 px-2 py-0.5 text-[10px] font-bold text-sage-deep">NEW</span>}
                      {p.preorder && <span className="ml-1 rounded-full bg-terra/15 px-2 py-0.5 text-[10px] font-bold text-terra-deep">PRÉCO</span>}
                      {p.partnerShared && <span className="ml-1 rounded-full bg-sage/30 px-2 py-0.5 text-[10px] font-bold text-sage-deep">PARTENAIRE</span>}
                      {p.videoUrl && <span className="ml-1 rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-bold text-ink-soft">VIDÉO</span>}
                    </span>
                  </Link>
                </td>
                <td className="hidden px-5 py-3 text-ink-soft sm:table-cell">
                  {CATEGORIES.find((c) => c.value === p.category)?.label ?? p.category}
                </td>
                <td className="px-5 py-3 font-bold">{formatPrice(p.priceCents)}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      p.stock === 0
                        ? "bg-blush/50 text-terra-deep"
                        : p.stock <= 3
                          ? "bg-sand/70 text-ink-soft"
                          : "bg-sage/25 text-sage-deep"
                    }`}
                  >
                    {p.stock}
                  </span>
                </td>
                <td className="hidden px-5 py-3 md:table-cell">
                  {p.active ? (
                    <span className="text-xs font-bold text-sage-deep">
                      ● En ligne
                      {p.preorder && <span className="ml-2 text-terra-deep">· Pré-commande</span>}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-ink-faint">○ Masqué</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
