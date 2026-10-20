import { getProducts } from "@/lib/store";
import { orderImageProducts } from "@/lib/order-images";
import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import ManualOrderForm from "@/components/admin/ManualOrderForm";

export const dynamic = "force-dynamic";
export default async function NouvelleCommandePage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const products = await getProducts({ includeInactive: true });
  return <ManualOrderForm products={orderImageProducts(products)} />;
}
