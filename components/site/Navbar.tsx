/* eslint-disable @next/next/no-img-element -- Original Kréarun brand asset. */
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import type { StoreCategory } from "@/lib/categories";

export default function Navbar({ categories }: { categories: StoreCategory[] }) {
  const { count, openCart } = useCart();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = [
    { href: "/boutique", label: "Boutique" },
    { href: "/boutique?nouveautes=1", label: "Nouveautés" },
    ...(categories.some(category => category.value === "veilleuses") ? [{ href: "/boutique?categorie=veilleuses", label: "Lampes" }] : []),
    ...(categories.some(category => category.value === "porte-boisson") ? [{ href: "/boutique?categorie=porte-boisson", label: "Porte-boisson" }] : []),
    { href: "/personnaliser", label: "Personnaliser" },
  ];
  const close = () => setMobileOpen(false);
  return <header className="editorial-header">
    <nav className="editorial-navigation" aria-label="Navigation principale">
      <Link href="/" onClick={close} aria-label="Kréarun — accueil" className="editorial-brand"><img src="/brand/krearun-badge.webp" alt="Kréarun" width={320} height={320} className="h-full w-full object-contain" /></Link>
      <ul className="hidden items-center gap-5 xl:gap-8 lg:flex">{links.map(link => <li key={link.href}><Link href={link.href} className="editorial-nav-link" aria-current={link.href === pathname && link.href !== "/boutique" ? "page" : undefined}>{link.label}</Link></li>)}</ul>
      <div className="flex items-center gap-3 sm:gap-5">
        <Link href="/compte" aria-label="Mon compte" className="editorial-nav-link hidden sm:block">Connexion</Link>
        <button type="button" onClick={openCart} aria-label="Ouvrir le panier" className="relative p-2">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M6 8h12l1 13H5L6 8Zm3 0V5a3 3 0 0 1 6 0v3"/></svg>
          {count > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-terra px-1 text-[10px] font-bold text-ink">{count}</span>}
        </button>
        <button type="button" onClick={() => setMobileOpen(value => !value)} aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={mobileOpen} aria-controls="store-mobile-menu" className="editorial-nav-link p-2 lg:hidden">{mobileOpen ? "Fermer" : "Menu"}</button>
      </div>
    </nav>
    {mobileOpen && <div id="store-mobile-menu" className="editorial-mobile-menu lg:hidden">
      <ul>{links.map(link => <li key={link.href}><Link href={link.href} onClick={close}>{link.label}</Link></li>)}<li><Link href="/compte" onClick={close}>Mon compte</Link></li></ul>
      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-sand pt-5">{categories.map(category => <Link key={category.value} href={`/boutique?categorie=${category.value}`} onClick={close} className="text-sm">{category.label}</Link>)}<Link href="/#atelier" onClick={close}>L’atelier</Link><Link href="/contact" onClick={close}>Contact</Link></div>
    </div>}
  </header>;
}
