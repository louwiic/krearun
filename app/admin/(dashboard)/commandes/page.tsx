import OrdersManager from "@/components/admin/OrdersManager";
import { getOrders } from "@/lib/store";
import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminCommandesPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <OrdersManager orders={await getOrders()} />;
}
