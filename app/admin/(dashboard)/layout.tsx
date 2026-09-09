import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { logoutAction } from "../actions";
import AdminShell from "@/components/admin/AdminShell";

const nav = [
  { href: "/admin", label: "Tableau de bord", icon: "🏠" },
  { href: "/admin/produits", label: "Produits", icon: "🧸" },
  { href: "/admin/categories", label: "Catégories", icon: "🗂️" },
  { href: "/admin/inventaire", label: "Inventaire", icon: "🎨" },
  { href: "/admin/calculateur", label: "Calculateur", icon: "🧮" },
  { href: "/admin/commandes", label: "Commandes", icon: "📦" },
  { href: "/admin/codes-promo", label: "Codes promo", icon: "🏷️" },
  { href: "/admin/clients", label: "Clients", icon: "👥" },
  { href: "/admin/avis", label: "Avis", icon: "⭐" },
  { href: "/admin/newsletter", label: "Newsletter", icon: "💌" },
  { href: "/admin/parametres", label: "Réglages", icon: "⚙️" },
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
                <span>{item.icon}</span> {item.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/"
            className="mb-3 flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-linen hover:text-ink"
          >
            🌿 Voir la boutique
          </Link>
          <form action={logoutAction}>
            <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-blush/30 hover:text-terra-deep">
              👋 Se déconnecter
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
              className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-semibold text-ink-soft"
            >
              <span className="text-lg">{item.icon}</span>
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
