import OrdersManager from "@/components/admin/OrdersManager";
import { getOrders, getProducts, getInventoryColors } from "@/lib/store";
import { buildOrderColorCatalog } from "@/lib/order-colors";
import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { orderDateKey } from "@/lib/order-list";

export const dynamic = "force-dynamic";

export default async function AdminCommandesPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const [orders, products, colors] = await Promise.all([
    getOrders(), getProducts({ includeInactive: true }), getInventoryColors({ includeInactive: true }),
  ]);
  return <OrdersManager orders={orders} colorCatalog={buildOrderColorCatalog(products, colors)} initialMonth={orderDateKey(new Date()).slice(0, 7)} />;
}
