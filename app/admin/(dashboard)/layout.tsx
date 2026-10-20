import Link from "next/link";
import BrandLogo from "@/components/site/BrandLogo";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { logoutAction } from "../actions";
import AdminShell from "@/components/admin/AdminShell";
import AdminIcon, { type AdminIconName } from "@/components/admin/AdminIcon";

const nav = [
  { href: "/admin", label: "Tableau de bord", icon: "dashboard" },
  { href: "/admin/produits", label: "Produits", icon: "products" },
  { href: "/admin/categories", label: "Catégories", icon: "categories" },
  { href: "/admin/inventaire", label: "Inventaire", icon: "inventory" },
  { href: "/admin/calculateur", label: "Calculateur", icon: "calculator" },
  { href: "/admin/generateur-3d", label: "Prénoms 3D", icon: "nozzle" },
  { href: "/admin/commandes", label: "Commandes", icon: "orders" },
  { href: "/admin/personnalisations", label: "Personnalisations", icon: "customize" },
  { href: "/admin/messages", label: "Messages", icon: "messages" },
  { href: "/admin/codes-promo", label: "Codes promo", icon: "promo" },
  { href: "/admin/clients", label: "Clients", icon: "clients" },
  { href: "/admin/avis", label: "Avis", icon: "reviews" },
  { href: "/admin/newsletter", label: "Newsletter", icon: "newsletter" },
  { href: "/admin/doc", label: "Doc", icon: "docs" },
  { href: "/admin/parametres", label: "Réglages", icon: "settings" },
] satisfies { href: string; label: string; icon: AdminIconName }[];

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

          <nav className="mt-10 flex flex-1 flex-col gap-1.5">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-linen hover:text-ink"
              >
                <AdminIcon name={item.icon} />
                {item.label}
              </Link>
            ))}
          </nav>

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
      mobileNavigation={
        <>
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex shrink-0 flex-col items-center gap-1 whitespace-nowrap px-3 py-2 text-xs font-semibold text-ink-soft hover:text-ink"
            >
              <AdminIcon name={item.icon} />
              {item.label}
            </Link>
          ))}
        </>
      }
    >
      {children}
    </AdminShell>
  );
}
