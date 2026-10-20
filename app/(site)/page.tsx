/* eslint-disable @next/next/no-img-element -- Product media and original brand artwork. */
import Link from "next/link";
import BrandLogo from "@/components/site/BrandLogo";
import SingleProductHome from "@/components/home/SingleProductHome";
import ProductCard from "@/components/product/ProductCard";
import { formatPrice } from "@/lib/format";
import { getApprovedReviews, getProducts, getSettings } from "@/lib/store";
import { getVisibleCategories } from "@/lib/categories";
import { HOLDER_SLUG } from "@/lib/custom-holder";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, settings, reviews] = await Promise.all([getProducts(), getSettings(), getApprovedReviews()]);
  const visibleValues = new Set(getVisibleCategories(settings.categories_json).map(category => category.value));
  const visible = products.filter(product => visibleValues.has(product.category));
  const featured = visible.filter(product => product.featured);
  const main = visible.find(product => product.slug === settings.homepage_featured_product_slug) ?? featured[0] ?? visible[0];
  const second = visible.find(product => product.slug === "porte-canette-red-bull" && product.id !== main?.id) ?? featured.find(product => product.id !== main?.id);
  const heroImage = settings.hero_image_url || main?.images[0] || "/home/hero-monster-product.webp";
  const heroHref = settings.hero_link_url || (main ? `/boutique/${main.slug}` : "/boutique");
  const selection = [...featured, ...visible.filter(product => !product.featured)].slice(0, 6);
  const spotlight = settings.homepage_mode === "single_product" && main;

  return <>
    <section className="border-b-2 border-ink bg-linen">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-10 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-20">
        <div>
          <BrandLogo signature className="mb-8 w-64 max-w-full sm:w-80" />
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">Votre atelier de personnalisation à La Réunion</p>
          <h1 className="font-display text-4xl text-ink sm:text-6xl">Découvrez nos produits <span className="relative inline-block">personnalisés<svg aria-hidden="true" viewBox="0 0 440 18" className="absolute -bottom-3 left-0 h-3 w-full text-[#FF6B35]" fill="none"><path d="M5 10C100 0 300 2 435 9" stroke="currentColor" strokeWidth="7" strokeLinecap="round"/></svg></span></h1>
          <p className="mt-8 max-w-lg text-base leading-relaxed text-ink-soft sm:text-lg">Vos idées, vos couleurs, votre prénom. Choisissez un modèle et donnez-lui votre touche, pour offrir ou vous faire plaisir.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/boutique" className="inline-flex min-h-12 items-center justify-center rounded-[10px] border-2 border-ink bg-terra px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-ink hover:text-cream">Découvrir la boutique <span aria-hidden="true" className="ml-3">↗</span></Link>
            <Link href="#personnaliser" className="inline-flex min-h-12 items-center justify-center rounded-[10px] border-2 border-ink px-6 py-3 text-sm font-bold transition-colors hover:bg-sage">Je personnalise</Link>
          </div>
          <p className="mt-6 text-xs text-ink-soft">Paiement sécurisé · Livraison à La Réunion · Un atelier à votre écoute</p>
        </div>
        <div className="relative min-w-0 pb-5 lg:pb-0">
          <Link href={heroHref} className="block overflow-hidden rounded-2xl border-2 border-ink bg-sage p-4 shadow-soft sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3 text-xs font-bold"><span>Une création, votre style.</span><span aria-hidden="true">↗</span></div>
            <img src={heroImage} alt={settings.hero_image_alt || main?.name || "Une création Kréarun personnalisée"} width={800} height={800} fetchPriority="high" className="aspect-square w-full rounded-xl object-cover" />
            {main && <div className="mt-4 flex items-center justify-between gap-4"><span className="text-sm font-bold">{main.name}</span><span className="shrink-0 rounded-lg bg-linen px-3 py-2 text-xs font-bold">{main.slug === HOLDER_SLUG || main.priceCents === 0 ? "À personnaliser" : `Dès ${formatPrice(main.priceCents)}`}</span></div>}
          </Link>
        </div>
      </div>
    </section>

    <section id="personnaliser" className="scroll-mt-24 px-5 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">C’est vous qui choisissez</p><h2 className="mt-3 font-display text-3xl sm:text-4xl">Une idée ? On lui donne forme.</h2></div><Link href="/boutique" className="text-sm font-bold underline underline-offset-4">Tous les produits ↗</Link></div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { number: "01", title: "Votre logo, votre porte-boisson", text: "Un corps, des couleurs et votre logo. Visualisez votre création avant de nous envoyer votre demande.", href: `/boutique/${HOLDER_SLUG}`, action: "Personnaliser mon porte-boisson", accent: "bg-sage" },
            { number: "02", title: "Une lettre qui vous ressemble", text: "Choisissez une lettre, sa forme et ses couleurs. Composez votre décoration, à votre façon.", href: "/lettre-personnalisee", action: "Créer ma lettre", accent: "bg-linen" },
            { number: "03", title: "Votre petit clic à vous", text: "Un texte, vos couleurs et une touche personnelle. Imaginez un clicker à offrir ou à garder.", href: "/clicker-studio", action: "Créer mon clicker", accent: "bg-linen" },
          ].map(card => <Link key={card.number} href={card.href} className={`group flex flex-col rounded-2xl border-2 border-ink p-6 shadow-soft transition-colors hover:bg-white ${card.accent}`}><span className="mb-8 text-xs font-bold">{card.number} / À votre image</span><h3 className="font-display text-2xl">{card.title}</h3><p className="mb-8 mt-3 flex-1 text-sm text-ink-soft">{card.text}</p><span className="text-sm font-bold underline underline-offset-4">{card.action} ↗</span></Link>)}
        </div>
      </div>
    </section>

    {spotlight ? <SingleProductHome product={main} secondaryProduct={second} settings={settings} reviews={reviews.filter(review => review.productId === main.id)} /> : null}

    {selection.length > 0 && <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">À découvrir dans la boutique</p><h2 className="mt-3 font-display text-3xl sm:text-4xl">Trouvez votre prochain coup de cœur.</h2></div><Link href="/boutique" className="text-sm font-bold underline underline-offset-4">Voir la collection ↗</Link></div><div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-8 lg:grid-cols-3">{selection.map(product => <ProductCard key={product.id} product={product} showCta />)}</div></section>}

    <section id="atelier" className="scroll-mt-24 border-y-2 border-ink bg-sage px-5 py-14 sm:px-6 sm:py-20"><div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[0.3fr_1fr]"><div className="mx-auto w-32 rounded-2xl bg-linen p-4 sm:w-40"><img src="/brand/krearun-nozzle.webp" alt="" width={310} height={410} className="h-auto w-full" /></div><div><p className="text-xs font-bold uppercase tracking-[0.14em]">L’atelier Kréarun</p><h2 className="mt-3 max-w-2xl font-display text-3xl sm:text-4xl">Vos idées prennent forme ici.</h2><p className="mt-5 max-w-2xl text-base text-ink-soft">À La Réunion, nous préparons vos créations avec soin et échangeons avec vous sur les détails qui comptent. Une couleur, un prénom, un logo ou une idée à imaginer ensemble : parlons-en.</p><Link href="/contact" className="mt-7 inline-flex rounded-[10px] border-2 border-ink bg-ink px-6 py-3 text-sm font-bold text-cream hover:bg-ink-soft">Parler de mon idée ↗</Link></div></div></section>

    {!spotlight && reviews.length > 0 && <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6"><h2 className="font-display text-3xl sm:text-4xl">Vos créations, vos mots.</h2><div className="mt-8 grid gap-4 md:grid-cols-3">{reviews.slice(0,3).map(review => <figure key={review.id} className="rounded-2xl border-2 border-ink bg-white p-6"><p aria-label={`${review.rating} sur 5`} className="text-lg">{"★ ".repeat(review.rating)}</p><blockquote className="mt-4 text-sm text-ink-soft">« {review.message} »</blockquote><figcaption className="mt-5 text-sm font-bold">{review.authorName}</figcaption></figure>)}</div></section>}
  </>;
}
