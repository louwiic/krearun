/* eslint-disable @next/next/no-img-element -- Product media and original brand artwork. */
import Link from "next/link";
import SingleProductHome from "@/components/home/SingleProductHome";
import ProductCard from "@/components/product/ProductCard";
import { getApprovedReviews, getProducts, getSettings } from "@/lib/store";
import { getVisibleCategories } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, settings, reviews] = await Promise.all([getProducts(), getSettings(), getApprovedReviews()]);
  const visibleValues = new Set(getVisibleCategories(settings.categories_json).map(category => category.value));
  const visible = products.filter(product => visibleValues.has(product.category));
  const featured = visible.filter(product => product.featured);
  const main = visible.find(product => product.slug === settings.homepage_featured_product_slug) ?? featured[0] ?? visible[0];
  const second = visible.find(product => product.slug === "porte-canette-red-bull" && product.id !== main?.id) ?? featured.find(product => product.id !== main?.id);
  const selection = [...featured, ...visible.filter(product => !product.featured)].slice(0, 6);
  const spotlight = settings.homepage_mode === "single_product" && main;

  return <>
    <section className="border-b-2 border-ink bg-linen">
      <h1 className="sr-only">Découvrez nos produits personnalisés — Kréarun, la personnalisation à fond !</h1>
      <img src="/brand/krearun-hero.webp" alt="Kréarun — La personnalisation à fond ! Tes idées. Tes couleurs. Ton style. Porte-boisson et porte-clés personnalisés." width={2017} height={780} fetchPriority="high" className="block h-auto w-full" />
    </section>

    {spotlight ? <SingleProductHome product={main} secondaryProduct={second} settings={settings} reviews={reviews.filter(review => review.productId === main.id)} /> : null}

    {selection.length > 0 && <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">À découvrir dans la boutique</p><h2 className="mt-3 font-display text-3xl sm:text-4xl">Trouvez votre prochain coup de cœur.</h2></div><Link href="/boutique" className="text-sm font-bold underline underline-offset-4">Voir la collection ↗</Link></div><div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-8 lg:grid-cols-3">{selection.map(product => <ProductCard key={product.id} product={product} showCta />)}</div></section>}

    <section id="atelier" className="scroll-mt-24 border-y-2 border-ink bg-sage px-5 py-14 sm:px-6 sm:py-20"><div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[0.3fr_1fr]"><div className="mx-auto w-32 rounded-2xl bg-linen p-4 sm:w-40"><img src="/brand/krearun-nozzle.webp" alt="" width={310} height={410} className="h-auto w-full" /></div><div><p className="text-xs font-bold uppercase tracking-[0.14em]">L’atelier Kréarun</p><h2 className="mt-3 max-w-2xl font-display text-3xl sm:text-4xl">Vos idées prennent forme ici.</h2><p className="mt-5 max-w-2xl text-base text-ink-soft">À La Réunion, nous préparons vos créations avec soin et échangeons avec vous sur les détails qui comptent. Une couleur, un prénom, un logo ou une idée à imaginer ensemble : parlons-en.</p><Link href="/contact" className="mt-7 inline-flex rounded-[10px] border-2 border-ink bg-ink px-6 py-3 text-sm font-bold text-cream hover:bg-ink-soft">Parler de mon idée ↗</Link></div></div></section>

    {!spotlight && reviews.length > 0 && <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6"><h2 className="font-display text-3xl sm:text-4xl">Vos créations, vos mots.</h2><div className="mt-8 grid gap-4 md:grid-cols-3">{reviews.slice(0,3).map(review => <figure key={review.id} className="rounded-2xl border-2 border-ink bg-white p-6"><p aria-label={`${review.rating} sur 5`} className="text-lg">{"★ ".repeat(review.rating)}</p><blockquote className="mt-4 text-sm text-ink-soft">« {review.message} »</blockquote><figcaption className="mt-5 text-sm font-bold">{review.authorName}</figcaption></figure>)}</div></section>}
  </>;
}
