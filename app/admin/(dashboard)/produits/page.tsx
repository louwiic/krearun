import Link from "next/link";
import { getProducts } from "@/lib/store";
import { ProductBulkTable } from "@/components/admin/ProductBulkTable";

export const dynamic = "force-dynamic";

export default async function AdminProduitsPage() {
  const products = await getProducts({ includeInactive: true });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Produits</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {products.length} produit{products.length > 1 ? "s" : ""}, offres sur mesure comprises
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
        <Link href="/admin/produits/sur-mesure" className="rounded-full border border-ink px-6 py-3 text-sm font-bold hover:bg-sand">+ Offre sur mesure</Link>
        <Link
          href="/admin/produits/nouveau"
          className="rounded-full bg-terra px-6 py-3 text-sm font-bold text-cream transition-colors hover:bg-terra-deep"
        >
          + Nouvel objet
        </Link>
        </div>
      </div>

      <ProductBulkTable products={products} />
    </div>
  );
}
