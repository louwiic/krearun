import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import QuoteWorkspace from "./workspace";
import "./admin.css";
export const metadata = {
  title: "Devis | Carrelage RS",
  robots: { index: false, follow: false },
};
export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <QuoteWorkspace />;
}
