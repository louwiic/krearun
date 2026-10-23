"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { createProduct } from "@/lib/store";
import { parsePrivateSale, privateSaleSlug } from "@/lib/private-sales";

export async function createPrivateSaleAction(_previous: { error: string }, form: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");
  let offer;
  try { offer = parsePrivateSale(form); }
  catch (error) { return { error: error instanceof Error ? error.message : "Vérifiez les informations." }; }
  let product;
  try {
    product = await createProduct({
      ...offer, slug: privateSaleSlug(offer.name), privateSale: true,
      tagline: "Une création préparée selon votre demande.", category: "deco",
      images: [], videoUrl: "", colors: [], variants: [], quantityDiscounts: [],
      active: true, featured: false, isNew: false, preorder: false, partnerShared: false,
      namePersonalizationEnabled: false, namePersonalizationPriceCents: 0,
    });
  } catch { return { error: "La création a échoué. Réessayez dans un instant." }; }
  revalidatePath("/admin/produits");
  redirect(`/admin/produits/${product.id}`);
}
