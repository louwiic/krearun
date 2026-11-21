import Link from "next/link";
import type { Metadata } from "next";
import ProductCard from "@/components/product/ProductCard";
import { getProducts, getSettings } from "@/lib/store";
import { getVisibleCategories } from "@/lib/categories";
import { CATEGORY_DESCRIPTIONS, SHOP_DESCRIPTION } from "@/lib/seo";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ categorie?: string; nouveautes?: string }> }): Promise<Metadata> {
  const { categorie, nouveautes } = await searchParams;
  const settings = await getSettings();
  const category = getVisibleCategories(settings.categories_json).find(category => category.value === categorie);
  const title = category ? `${category.label}${nouveautes === "1" ? " : nouveautés" : ""} à La Réunion` : nouveautes === "1" ? "Nouveautés personnalisées à La Réunion" : "Boutique d’objets personnalisés à La Réunion";
  const description = category ? CATEGORY_DESCRIPTIONS[category.value] || `${category.label} : découvrez les créations Kréarun à La Réunion.` : SHOP_DESCRIPTION;
  const query = new URLSearchParams();
  if (category) query.set("categorie", category.value);
  if (nouveautes === "1") query.set("nouveautes", "1");
  const canonical = `/boutique${query.size ? `?${query}` : ""}`;
  return { title, description, alternates: { canonical }, openGraph: { title, description, url: canonical } };
}

export default async function BoutiquePage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string; nouveautes?: string }>;
}) {
  const { categorie, nouveautes } = await searchParams;
  const [allProducts, settings] = await Promise.all([getProducts(), getSettings()]);
  const categories = getVisibleCategories(settings.categories_json);
  const visibleValues = new Set(categories.map((category) => category.value));
  const products = allProducts.filter((product) => visibleValues.has(product.category));
  const valid = categories.some((c) => c.value === categorie);
  const filtered = (valid ? products.filter(p => p.category === (categorie as Category)) : products).filter(p => nouveautes !== "1" || p.isNew);
  const currentLabel = valid
    ? categories.find((c) => c.value === categorie)!.label
    : null;

  return <div className="editorial-shop">
    <header className="editorial-shop-heading"><p className="editorial-eyebrow">La boutique Kréarun</p><h1>{currentLabel || (nouveautes === "1" ? "Nouveautés" : "Nos objets, votre style.")}</h1><p>{valid ? CATEGORY_DESCRIPTIONS[categorie!] || `Découvrez nos créations ${currentLabel} préparées à La Réunion.` : SHOP_DESCRIPTION}</p></header>
    <div className="editorial-shop-layout">
      <aside aria-label="Collections" className="editorial-collection-nav"><Link href="/boutique" aria-current={!valid && nouveautes !== "1" ? "page" : undefined}>Tous les objets</Link><Link href="/boutique?nouveautes=1" aria-current={nouveautes === "1" && !valid ? "page" : undefined}>Nouveautés</Link>{categories.map(category => <Link key={category.value} href={`/boutique?categorie=${category.value}`} aria-current={categorie === category.value ? "page" : undefined}>{category.label}</Link>)}</aside>
      <div>{(!valid || categorie === "rangement") && <Link href="/boutique/coffrets-bijoux" className="mb-8 flex flex-col overflow-hidden rounded-2xl border border-sand bg-white sm:flex-row">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/coffrets/Photos/Coco-ouvert-v01.webp" alt="Coffret tropical Coco" width="300" height="200" className="w-full object-cover sm:w-56"/><div className="p-6"><p className="text-sm font-semibold text-terra">Nouvelle collection · à découvrir</p><h2 className="mt-2 font-display text-2xl">Les coffrets à bijoux tropicaux</h2><p className="mt-2">Huit décors péi, deux formats et vos couleurs préférées.</p><p className="mt-3 text-sm font-bold">Dès 9,90 € · Composer mon coffret</p></div></Link>}{filtered.length === 0 ? <div className="py-16"><p className="font-display text-2xl">L’atelier prépare la suite.</p><p className="mt-3 text-sm text-ink-soft">Aucune création dans cette collection pour le moment.</p></div> : <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3 lg:gap-x-5">{filtered.map((product,index) => <ProductCard key={product.id} product={product} priority={index < 3} />)}</div>}</div>
    </div>
  </div>;
}
