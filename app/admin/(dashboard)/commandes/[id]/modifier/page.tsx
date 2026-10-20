import { orderImageProducts } from "@/lib/order-images";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import ManualOrderForm from "@/components/admin/ManualOrderForm";
import { getOrderById, getProducts } from "@/lib/store";

export const dynamic = "force-dynamic";
export default async function ModifierCommandePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  const order = await getOrderById((await params).id);
  if (!order) notFound();
  const products = await getProducts({ includeInactive: true });
  return <ManualOrderForm order={order} products={orderImageProducts(products)} />;
}
