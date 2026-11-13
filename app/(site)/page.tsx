import HomeHighlight from "@/components/home/HomeHighlight";
import { parseHomeHighlight } from "@/lib/home-highlight";
import NewArrivalsCarousel from "@/components/home/NewArrivalsCarousel";
import { hasFreeShipping } from "@/lib/free-shipping";
import ExpressOfferBanner from "@/components/site/ExpressOfferBanner";
/* eslint-disable @next/next/no-img-element -- Product media and original brand artwork. */
import Link from "next/link";
import type { Metadata } from "next";
import { BUSINESS } from "@/lib/legal";
import { siteOrigin, jsonLdString } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: "Objets personnalisés à La Réunion · Kréarun" },
  description: "Porte-boissons, lampes, lettres et cadeaux personnalisés : vos idées prennent forme dans notre atelier de fabrication artisanale à La Réunion. Découvrez la boutique Kréarun.",
  alternates: { canonical: "/" },
};
import HomeReviews from "@/components/home/HomeReviews";
import ProductCard from "@/components/product/ProductCard";
import Gallery from "@/components/product/Gallery";
import MonsterProductGallery from "@/components/product/MonsterProductGallery";
import { MONSTER_SLUG } from "@/lib/monster-preview";
import AddToCart from "@/components/product/AddToCart";
import { formatPrice } from "@/lib/format";
import { publicProductCopy } from "@/lib/public-copy";
import { getApprovedReviews, getProducts, getSettings } from "@/lib/store";
import { getVisibleCategories } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, settings, reviews] = await Promise.all([getProducts(), getSettings(), getApprovedReviews()]);
  const visibleValues = new Set(getVisibleCategories(settings.categories_json).map(category => category.value));
  const visible = products.filter(product => visibleValues.has(product.category));
  const featured = visible.filter(product => product.featured);
  const main = visible.find(product => product.slug === settings.homepage_featured_product_slug) ?? featured[0] ?? visible[0];
  const selection = [...featured, ...visible.filter(product => !product.featured)].slice(0, 6);
  const newArrivals = visible
    .filter(product => product.active && !product.privateSale && product.isNew && product.id !== main?.id && product.images?.length)
    .sort((a, b) => Number(b.slug === "porte-boisson-sweat-monster") - Number(a.slug === "porte-boisson-sweat-monster") || Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 12)
    .map(product => {
      const prices = product.variants.filter(variant => variant.active).map(variant => variant.priceCents || product.priceCents);
      return { id: product.id, slug: product.slug, name: product.name, image: product.images[0], priceCents: prices.length ? Math.min(...prices) : product.priceCents, fromPrice: prices.length > 1, freeShipping: hasFreeShipping(product.slug) };
    });
  const spotlight = settings.homepage_mode === "single_product" && main;
  const collections = [
    { name: "Porte-boisson", href: "/boutique?categorie=porte-boisson", product: main?.category === "porte-boisson" && main.images?.length ? main : visible.find(product => product.category === "porte-boisson" && product.images?.length) },
    { name: "Lampes", href: "/boutique?categorie=veilleuses", product: visible.find(product => product.category === "veilleuses" && product.images?.length) },
    { name: "Noël", href: "/boutique?categorie=noel", product: visible.find(product => product.category === "noel" && product.images?.length) },
    { name: "Nouveautés", href: "/boutique?nouveautes=1", product: visible.find(product => product.isNew && product.images?.length && product.id !== main?.id) },
  ].filter(collection => collection.product);
  const variantPrices = main?.variants.filter(variant => variant.active).map(variant => variant.priceCents || main.priceCents) ?? [];
  const displayPrice = main ? (variantPrices.length ? Math.min(...variantPrices) : main.priceCents) : 0;

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString({
      "@context": "https://schema.org", "@type": "Organization", "@id": `${siteOrigin()}/#organization`,
      name: BUSINESS.tradeName, legalName: BUSINESS.name, url: siteOrigin(), logo: `${siteOrigin()}/brand/krearun-wordmark.webp`,
      email: BUSINESS.email, telephone: BUSINESS.phoneHref,
      address: { "@type": "PostalAddress", streetAddress: BUSINESS.address, postalCode: BUSINESS.postalCode, addressLocality: BUSINESS.city, addressRegion: "La Réunion", addressCountry: "RE" },
    }) }} />
    <section className="border-b-2 border-ink bg-linen">
      <h1 className="sr-only">Découvrez nos produits personnalisés — Kréarun, la personnalisation à fond !</h1>
      <img src="/brand/krearun-hero.webp" alt="Kréarun — La personnalisation à fond ! Tes idées. Tes couleurs. Ton style. Porte-boisson et porte-clés personnalisés." width={2017} height={780} fetchPriority="high" className="block h-auto w-full" />
    </section>

    <NewArrivalsCarousel items={newArrivals} />

    <ExpressOfferBanner enabled={settings.express_offer_enabled} title={settings.express_offer_title} description={settings.express_offer_description} image={settings.express_offer_image} cta={settings.express_offer_cta} href={settings.express_offer_href} />

    {spotlight && <section id="choisir-mon-modele" className="editorial-section" aria-labelledby="home-product-title">
      <div className="grid min-w-0 grid-cols-1 gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-10">
        {main.slug === MONSTER_SLUG ? <MonsterProductGallery product={main} images={main.images} videoUrl={main.videoUrl} name={main.name} initialColor={main.colors[0] || {name:"Blanc",hex:"#ffffff"}} /> : <Gallery
          images={[...main.images, ...main.variants.map(variant => variant.image), ...main.colors.map(color => color.image)].filter((image, index, images): image is string => Boolean(image) && images.indexOf(image) === index)}
          videoUrl={main.videoUrl}
          name={main.name}
        />}
        <div className="min-w-0">
          <p className="editorial-eyebrow">Vos couleurs, votre style</p>
          <h2 id="home-product-title" data-product-impression={main.id} className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">{main.name}</h2>
          <p className="mt-3 text-base italic text-ink-soft sm:text-lg">{publicProductCopy(main.tagline)}</p>
          <p className="mt-5 font-display text-2xl font-semibold sm:text-3xl">{variantPrices.length > 1 && <span className="mr-2 text-base text-ink-soft">Dès</span>}{formatPrice(displayPrice)}</p>
          <div className="mt-6 sm:mt-8"><AddToCart product={main} /></div>
          <Link href={`/boutique/${main.slug}`} className="mt-5 inline-block text-sm underline underline-offset-4">Voir la fiche complète</Link>
        </div>
      </div>
    </section>}

    <HomeHighlight config={parseHomeHighlight(settings.homepage_highlight_json)} products={visible} />

    <section className="editorial-section" aria-labelledby="home-selection-title">
      <div className="editorial-section-heading"><h2 id="home-selection-title">Votre sélection</h2><Link href="/boutique">Voir la boutique ↗</Link></div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          { image: "monster-blue", title: "Monster bleu & violet", alt: "Deux porte-canettes Monster bleu et violet avec leurs accessoires sur fond uni", slug: "porte-canette-monster" },
          { image: "nos-blue", title: "Porte-boisson NOS", alt: "Porte-boisson NOS bleu avec sa chaîne et son médaillon sur fond uni", slug: "porte-boisson-nos-500ml" },
          { image: "monster-gold", title: "Monster argent & or", alt: "Porte-canette Monster noir, griffes argent et or, avec ses accessoires sur fond uni", slug: "porte-canette-monster" },
        ].map(item => <Link key={item.image} href={`/boutique/${item.slug}`} className="group min-w-0">
          <div className="aspect-square overflow-hidden rounded-2xl border border-ink/10 bg-[#F6F2ED]">
            <img src={`/products/home-selection/${item.image}.webp`} alt={item.alt} width={1000} height={1000} loading="lazy" className="h-full w-full object-contain object-center" />
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold group-hover:underline">{item.title} <span aria-hidden="true">↗</span></h3>
        </Link>)}
      </div>
    </section>

    <section className="editorial-promises" aria-label="L’atelier Kréarun">
      {[
        ["01", "Fabrication artisanale", "Vos créations prennent forme avec soin dans notre atelier."],
        ["02", "À votre image", "Un prénom, un logo, vos couleurs : composez votre objet."],
        ["03", "Préparé avec soin", "Les créations de l’atelier demandent 2 à 4 jours de préparation."],
        ["04", "On en parle ?", "Une demande particulière ? Échangeons sur votre idée."],
      ].map(([number,title,text]) => <div key={number}><span className="editorial-promise-number">{number}</span><h2>{title}</h2><p>{text}</p></div>)}
    </section>

    {collections.length > 0 && <section className="editorial-collections" aria-label="Nos collections">{collections.map(collection => <Link key={collection.name} href={collection.href}><div className="aspect-square overflow-hidden bg-cream"><img src={collection.product!.images[0]} alt={collection.name} loading="lazy" width={700} height={700} className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.025]" /></div><h2>{collection.name} <span aria-hidden>↗</span></h2></Link>)}</section>}

    {selection.length > 0 && <section className="editorial-section"><div className="editorial-section-heading"><h2>Des créations qui vous ressemblent.</h2><Link href="/boutique">Tous les objets ↗</Link></div><div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3 lg:gap-x-6">{selection.map(product => <ProductCard key={product.id} product={product} />)}</div></section>}

    <section id="atelier" className="editorial-workshop"><img src="/brand/krearun-nozzle.webp" alt="" width={310} height={410} loading="lazy"/><div><p className="editorial-eyebrow">L’atelier Kréarun</p><h2>Une idée ?<br/>On lui donne forme.</h2><p>Dans notre atelier de fabrication artisanale, nous préparons vos créations avec soin. Une couleur, un prénom, un logo ou une idée à imaginer ensemble : parlons-en.</p><Link href="/contact" className="editorial-pill">Rencontrer l’atelier ↗</Link></div></section>

    <HomeReviews reviews={reviews} />
  </>;
}
