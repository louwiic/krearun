/* eslint-disable @next/next/no-img-element -- Original Kréarun brand asset. */
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { groupStoreCategories, type StoreCategory } from "@/lib/categories";

export default function Navbar({ categories }: { categories: StoreCategory[] }) {
  const { count, openCart } = useCart();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const shopButton = useRef<HTMLButtonElement>(null);
  const groups = groupStoreCategories(categories);
  const links = [
    { href: "/boutique?nouveautes=1", label: "Nouveautés" },
    { href: "/personnaliser", label: "Personnaliser" },
    { href: "/#atelier", label: "L’atelier" },
    { href: "/contact", label: "Contact" },
  ];
  const close = () => { setMobileOpen(false); setShopOpen(false); };
  useEffect(() => {
    function outside(event: PointerEvent) { if (event.target instanceof Node && !header.current?.contains(event.target)) close(); }
    function escape(event: KeyboardEvent) { if (event.key === "Escape") { close(); if (shopOpen) shopButton.current?.focus(); } }
    document.addEventListener("pointerdown",outside); document.addEventListener("keydown",escape);
    return () => { document.removeEventListener("pointerdown",outside); document.removeEventListener("keydown",escape); };
  },[shopOpen]);
  const categoryLink = (category: StoreCategory) => <Link key={category.value} href={`/boutique?categorie=${category.value}`} onClick={close} className="block py-2 text-base hover:underline focus-visible:underline">{category.label}</Link>;
  return <header ref={header} className="editorial-header">
    <nav className="editorial-navigation" aria-label="Navigation principale">
      <Link href="/" onClick={close} aria-label="Kréarun — accueil" className="editorial-brand"><img src="/brand/krearun-badge.webp" alt="Kréarun" width={320} height={320} className="h-full w-full object-contain" /></Link>
      <ul className="hidden items-center gap-5 xl:gap-8 lg:flex">
        <li><button ref={shopButton} type="button" className="editorial-nav-link flex items-center gap-2" aria-expanded={shopOpen} aria-controls="store-shop-categories" onClick={() => setShopOpen(value=>!value)}><span>Boutique</span><svg aria-hidden="true" className={`h-3 w-3 transition-transform ${shopOpen ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m2 4 4 4 4-4"/></svg></button></li>
        {links.map(link => <li key={link.href}><Link href={link.href} onClick={close} className="editorial-nav-link" aria-current={link.href === pathname ? "page" : undefined}>{link.label}</Link></li>)}
      </ul>
      <div className="flex items-center gap-3 sm:gap-5">
        <Link href="/compte" onClick={close} aria-label="Mon compte" className="editorial-nav-link hidden sm:block">Connexion</Link>
        <button type="button" onClick={() => {close();openCart();}} aria-label="Ouvrir le panier" className="relative p-2">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M6 8h12l1 13H5L6 8Zm3 0V5a3 3 0 0 1 6 0v3"/></svg>
          {count > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-terra px-1 text-[10px] font-bold text-ink">{count}</span>}
        </button>
        <button type="button" onClick={() => {setMobileOpen(value => !value);setShopOpen(false);}} aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={mobileOpen} aria-controls="store-mobile-menu" className="editorial-nav-link p-2 lg:hidden">{mobileOpen ? "Fermer" : "Menu"}</button>
      </div>
    </nav>
    {shopOpen && <nav id="store-shop-categories" aria-label="Catégories de la boutique" className="absolute inset-x-0 top-full hidden max-h-[75svh] overflow-auto border-y border-sand bg-linen shadow-soft lg:block"><div className="mx-auto max-w-6xl px-8 py-7"><Link href="/boutique" onClick={close} className="mb-6 inline-block border-b border-current pb-1 font-semibold">Tous les produits ↗</Link><div className="grid grid-cols-4 gap-8">{groups.map(group=><section key={group.id}><h2 className="mb-3 font-display text-lg font-semibold">{group.label}</h2>{group.categories.map(categoryLink)}</section>)}</div></div></nav>}
    {mobileOpen && <div id="store-mobile-menu" className="editorial-mobile-menu lg:hidden">
      <Link href="/boutique" onClick={close} className="mb-4 block text-xl font-semibold">Tous les produits</Link>
      <nav aria-label="Catégories de la boutique sur mobile" className="mb-5 divide-y divide-sand border-y border-sand">{groups.map(group=><details key={group.id} className="py-3"><summary className="cursor-pointer py-1 text-lg font-semibold">{group.label}</summary><div className="pl-4 pt-2">{group.categories.map(categoryLink)}</div></details>)}</nav>
      <ul>{links.map(link => <li key={link.href}><Link href={link.href} onClick={close}>{link.label}</Link></li>)}<li><Link href="/compte" onClick={close}>Mon compte</Link></li></ul>
    </div>}
  </header>;
}
