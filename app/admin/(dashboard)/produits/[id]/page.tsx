import Link from "next/link";
import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import DeleteProductButton from "@/components/admin/DeleteProductButton";
import { getInventoryColors, getProductById } from "@/lib/store";

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
      <ProductForm product={product} inventoryColors={inventoryColors} />
      <div className="mt-10 border-t border-sand/70 pt-6">
        <DeleteProductButton id={product.id} name={product.name} />
      </div>
    </div>
  );
}
