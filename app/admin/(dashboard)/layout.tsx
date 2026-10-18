import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { logoutAction } from "../actions";
import AdminShell from "@/components/admin/AdminShell";

const nav = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/produits", label: "Produits" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/inventaire", label: "Inventaire" },
  { href: "/admin/calculateur", label: "Calculateur" },
  { href: "/admin/generateur-3d", label: "Prénoms 3D" },
  { href: "/admin/commandes", label: "Commandes" },
  { href: "/admin/personnalisations", label: "Personnalisations" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/codes-promo", label: "Codes promo" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/avis", label: "Avis" },
  { href: "/admin/newsletter", label: "Newsletter" },
  { href: "/admin/doc", label: "Doc" },
  { href: "/admin/parametres", label: "Réglages" },
];

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
          <Link href="/admin" className="font-display text-xl font-semibold">
            Krearun<span className="text-terra">·</span>Admin
          </Link>

          <nav className="mt-10 flex flex-1 flex-col gap-1.5">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-linen hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/"
            className="mb-3 flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-linen hover:text-ink"
          >
            Voir la boutique
          </Link>
          <form action={logoutAction}>
            <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-blush/30 hover:text-terra-deep">
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
              className="shrink-0 whitespace-nowrap px-3 py-2 text-xs font-semibold text-ink-soft"
            >
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
