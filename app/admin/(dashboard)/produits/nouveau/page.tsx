import Link from "next/link";
import ProductForm from "@/components/admin/ProductForm";
import { getInventoryColors } from "@/lib/store";

export default async function NouveauProduitPage() {
  const inventoryColors = await getInventoryColors();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/produits" className="text-sm font-semibold text-ink-faint hover:text-terra">
        ← Retour aux produits
      </Link>
      <h1 className="mb-8 mt-2 font-display text-3xl font-semibold">
        Nouvel objet
      </h1>
      <ProductForm inventoryColors={inventoryColors} />
    </div>
  );
}
