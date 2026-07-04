import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { logoutAction } from "../actions";

const nav = [
  { href: "/admin", label: "Tableau de bord", icon: "🏠" },
  { href: "/admin/produits", label: "Produits", icon: "🧸" },
  { href: "/admin/calculateur", label: "Calculateur", icon: "🧮" },
  { href: "/admin/commandes", label: "Commandes", icon: "📦" },
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
    <div className="flex min-h-screen bg-linen">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-sand/70 bg-cream px-5 py-8 md:flex">
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
      </aside>

      {/* Barre mobile */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-sand bg-cream py-2 md:hidden">
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
      </div>

      <main className="flex-1 px-5 py-10 pb-24 md:ml-60 md:px-10 md:pb-10">
        {children}
      </main>
    </div>
  );
}
