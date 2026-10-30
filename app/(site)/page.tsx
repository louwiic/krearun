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
  const spotlight = settings.homepage_mode === "single_product" && main;
  const collections = [
    { name: "Porte-boisson", href: "/boutique?categorie=porte-boisson", product: main?.category === "porte-boisson" && main.images?.length ? main : visible.find(product => product.category === "porte-boisson" && product.images?.length) },
    { name: "Lampes", href: "/boutique?categorie=veilleuses", product: visible.find(product => product.category === "veilleuses" && product.images?.length) },
    { name: "Lunettes", href: "/boutique?categorie=lunette", product: visible.find(product => product.category === "lunette" && product.images?.length) },
    { name: "Nouveautés", href: "/boutique?nouveautes=1", product: visible.find(product => product.isNew && product.images?.length && product.id !== main?.id) },
  ].filter(collection => collection.product);
  const heroImage = settings.hero_image_url || main?.images?.[0] || "/brand/krearun-hero.webp";

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

    {spotlight && <section className="editorial-feature"><img src={main.images?.[0] || heroImage} alt={main.name} width={1000} height={1000} loading="lazy"/><div><p className="editorial-eyebrow">À découvrir à l’atelier</p><h2>{main.name}</h2><p>Vos couleurs, votre prénom et une création à emporter partout. Découvrez les modèles et les options sur la fiche produit.</p><Link href={`/boutique/${main.slug}`} className="editorial-pill">Découvrir ce modèle</Link></div></section>}

    <section id="atelier" className="editorial-workshop"><img src="/brand/krearun-nozzle.webp" alt="" width={310} height={410} loading="lazy"/><div><p className="editorial-eyebrow">L’atelier Kréarun</p><h2>Une idée ?<br/>On lui donne forme.</h2><p>Dans notre atelier de fabrication artisanale, nous préparons vos créations avec soin. Une couleur, un prénom, un logo ou une idée à imaginer ensemble : parlons-en.</p><Link href="/contact" className="editorial-pill">Rencontrer l’atelier ↗</Link></div></section>

    <HomeReviews reviews={reviews} />
  </>;
}
