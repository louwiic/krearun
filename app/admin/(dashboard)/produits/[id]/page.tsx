import Link from "next/link";
import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { PrivateSaleShare } from "@/components/admin/PrivateSaleShare";
import DeleteProductButton from "@/components/admin/DeleteProductButton";
import { getInventoryColors, getProductById, getProductPrintFiles } from "@/lib/store";
import ProductPrintFiles from "@/components/admin/ProductPrintFiles";

export const dynamic = "force-dynamic";

export default async function EditProduitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, inventoryColors] = await Promise.all([
    getProductById(id),
    getInventoryColors({ includeInactive: true }),
  ]);
  if (!product) notFound();
  const printFiles = await getProductPrintFiles(id);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <Link href="/admin/produits" className="text-sm font-semibold text-ink-faint hover:text-terra">
          ← Retour aux produits
        </Link>
        <Link
          href={`/boutique/${product.slug}`}
          target="_blank"
          className="text-sm font-semibold text-terra hover:underline"
        >
          Voir sur la boutique ↗
        </Link>
      </div>
      <h1 className="mb-8 mt-2 font-display text-3xl font-semibold">
        {product.name}
      </h1>
      {product.privateSale && <PrivateSaleShare slug={product.slug} active={product.active} />}
      <Link href={`/admin/produits/statistiques?produit=${product.id}`} className="mb-6 inline-block text-sm font-semibold underline">Voir les impressions, clics et vues de ce produit ↗</Link>
      <ProductPrintFiles productId={id} files={printFiles} noelKit={product.slug.startsWith("noel-thermoforme-")} />
      <ProductForm product={product} inventoryColors={inventoryColors} />
      <div className="mt-10 border-t border-sand/70 pt-6">
        <DeleteProductButton id={product.id} name={product.name} />
      </div>
    </div>
  );
}
