import Link from "next/link";
import AdminToasts from "@/components/admin/AdminToasts";
import { getAdminNotice } from "@/lib/admin-notice";
import BrandLogo from "@/components/site/BrandLogo";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { logoutAction } from "../actions";
import AdminShell from "@/components/admin/AdminShell";
import AdminIcon from "@/components/admin/AdminIcon";
import AdminNavigation from "@/components/admin/AdminNavigation";


export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <AdminShell
      sidebar={
        <>
          <Link href="/admin" className="inline-flex flex-col items-start gap-2" aria-label="Kréarun Admin"><span className="rounded-xl bg-linen p-2"><BrandLogo className="w-36" /></span><span className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">Administration</span></Link>

          <AdminNavigation />

          <Link
            href="/"
            className="mb-3 flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-linen hover:text-ink"
          >
            <AdminIcon name="shop" />
            Voir la boutique
          </Link>
          <form action={logoutAction}>
            <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-blush/30 hover:text-terra-deep">
              <AdminIcon name="logout" />
              Se déconnecter
            </button>
          </form>
        </>
      }
      mobileNavigation={<AdminNavigation mobile />}
    >
      <AdminToasts notice={await getAdminNotice()} />
      {children}
    </AdminShell>
  );
}
