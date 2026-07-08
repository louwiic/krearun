import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import { getProducts, getSettings } from "@/lib/store";
import { CATEGORIES } from "@/lib/types";

export const dynamic = "force-dynamic";

const avis = [
  {
    text: "La lampe plissée trône sur mon buffet et tout le monde me demande d'où elle vient. La lumière du soir est d'une douceur incroyable.",
    author: "Camille R.",
    product: "Lampe Plissée Trépied",
  },
  {
    text: "Emballage adorable, petit mot manuscrit, et le vase est encore plus beau qu'en photo. On sent l'amour du détail.",
    author: "Mathieu L.",
    product: "Vase Pétale",
  },
  {
    text: "Le set Rivage a transformé notre salle de bain : tout est rangé, et les stries cachent vraiment les traces d'eau. Malin et beau.",
    author: "Inès B.",
    product: "Set Salle de Bain Rivage",
  },
];

const CATEGORY_ART: Record<string, string> = {
  veilleuses: "/products/veilleuse-lune.svg",
  vases: "/products/vase-ondule.svg",
  bureau: "/products/organiseur-dune.svg",
  rangement: "/products/boite-coquillage.svg",
  "salle-de-bain": "/products/vide-poche-galet.svg",
  deco: "/products/dessous-verre-ondes.svg",
};

export default async function HomePage() {
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);
  const featured = products.filter((p) => p.featured).slice(0, 4);
  const nouveautes = products.filter((p) => p.isNew).slice(0, 3);
  const heroMain = featured[0] ?? products[0];
  const heroSecond = featured.find((p) => p.id !== heroMain?.id) ?? products[1];
  const heroImage = settings.hero_image_url || heroMain?.images[0] || "/products/hero.svg";
  const heroAlt = settings.hero_image_alt || heroMain?.name || "Produit Krearun Studio";
  const heroHref = settings.hero_link_url || (heroMain ? `/boutique/${heroMain.slug}` : "/boutique");

  return (
    <>
      {/* ── Héro ─────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blush/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-40 h-80 w-80 rounded-full bg-sage/30 blur-3xl"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 md:grid-cols-2 md:pt-24">
          <div>
            <p className="reveal mb-4 inline-flex items-center gap-2 rounded-full bg-sage/20 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-sage-deep">
              ✿ Fabriqué lentement, dans notre atelier
            </p>
            <h1 className="reveal reveal-1 font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Des objets
              <br />
              imprimés en 3D,
              <br />
              <em className="text-terra">tout en douceur.</em>
            </h1>
            <p className="reveal reveal-2 mt-6 max-w-md text-lg leading-relaxed text-ink-soft">
              Veilleuses, vases et petits compagnons du quotidien, imprimés
              couche par couche à la commande — rien que pour vous, et pour
              longtemps.
            </p>
            <div className="reveal reveal-3 mt-9 flex flex-wrap gap-4">
              <Link
                href="/boutique"
                className="rounded-full bg-terra px-8 py-4 text-sm font-bold text-cream transition-all hover:bg-terra-deep hover:shadow-lifted"
              >
                Découvrir la boutique
              </Link>
              <Link
                href="/a-propos"
                className="rounded-full border border-sand bg-cream px-8 py-4 text-sm font-bold text-ink transition-colors hover:border-terra hover:text-terra"
              >
                Visiter l'atelier
              </Link>
            </div>
          </div>

          <div className="reveal reveal-2 relative">
            {heroImage && (
              <Link
                href={heroHref}
                className="block animate-float overflow-hidden rounded-[3rem] shadow-lifted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroImage}
                  alt={heroAlt}
                  className="aspect-square w-full object-cover"
                />
              </Link>
            )}
            {heroSecond && (
              <Link
                href={`/boutique/${heroSecond.slug}`}
                className="animate-drift absolute -bottom-8 -left-8 hidden w-40 overflow-hidden rounded-[2rem] border-4 border-linen shadow-lifted sm:block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroSecond.images[0]}
                  alt={heroSecond.name}
                  className="aspect-square w-full object-cover"
                />
              </Link>
            )}
            <p className="absolute -right-2 top-6 hidden rotate-6 rounded-2xl bg-cream px-4 py-2 font-display text-sm italic text-ink-soft shadow-soft md:block">
              imprimé pour vous ✿
            </p>
          </div>
        </div>
      </section>

      {/* ── Bande réassurance ────────────────────────── */}
      <section className="border-y border-sand/60 bg-cream/70">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-3">
          {[
            ["🌱", "PLA biosourcé", "Un plastique d'origine végétale, imprimé sans gaspillage."],
            ["🤲", "Fait à la commande", "Chaque pièce démarre son impression quand vous commandez."],
            ["📦", "Emballé avec soin", "Papier de soie, petit mot doux et carton recyclé."],
          ].map(([icon, title, text]) => (
            <div key={title as string} className="flex items-start gap-4">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-display font-semibold">{title}</p>
                <p className="mt-1 text-sm text-ink-soft">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Nouveautés ───────────────────────────────── */}
      {nouveautes.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-terra">
                Fraîchement sorties de l'imprimante
              </p>
              <h2 className="font-display text-4xl font-semibold tracking-tight">
                Les nouveautés
              </h2>
            </div>
            <Link
              href="/boutique"
              className="nav-link hidden text-sm font-bold text-ink-soft hover:text-ink sm:block"
            >
              Tout voir →
            </Link>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {nouveautes.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── Catégories ───────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <h2 className="mb-8 font-display text-2xl font-semibold">
          Par petits univers
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c) => (
            <Link
              key={c.value}
              href={`/boutique?categorie=${c.value}`}
              className="group overflow-hidden rounded-blob bg-cream text-center shadow-soft transition-shadow hover:shadow-lifted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={CATEGORY_ART[c.value]}
                alt=""
                aria-hidden
                className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <p className="px-2 py-3.5 text-sm font-bold text-ink-soft group-hover:text-terra">
                {c.label}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Coups de cœur ────────────────────────────── */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
          <div className="mb-10">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-sage-deep">
              Les préférés de l'atelier
            </p>
            <h2 className="font-display text-4xl font-semibold tracking-tight">
              Nos coups de cœur
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── Notre histoire ───────────────────────────── */}
      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[3rem] bg-sage/15 px-6 py-16 sm:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blush/30 blur-3xl"
          />
          <div className="relative grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-sage-deep">
                De notre famille à la vôtre
              </p>
              <h2 className="font-display text-3xl font-semibold leading-snug sm:text-4xl">
                Un petit atelier, deux imprimantes,
                <br className="hidden sm:block" /> et beaucoup de patience.
              </h2>
              <p className="mt-5 max-w-lg leading-relaxed text-ink-soft">
                Krearun Studio est né dans un coin de salon, entre une bobine de
                filament crème et une tasse de thé. Chaque objet est dessiné,
                imprimé, poncé puis emballé à la main. On fabrique lentement, en
                petites quantités — parce que les jolies choses prennent le
                temps qu'il faut.
              </p>
              <Link
                href="/a-propos"
                className="mt-7 inline-block rounded-full bg-ink px-7 py-3.5 text-sm font-bold text-cream transition-colors hover:bg-terra"
              >
                Lire notre histoire
              </Link>
            </div>
            <div className="mx-auto w-full max-w-xs rotate-2 overflow-hidden rounded-[2.5rem] border-8 border-cream shadow-lifted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/products/atelier.svg"
                alt="L'atelier Krearun Studio"
                className="aspect-square w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Avis ─────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-terra">
            Ils nous ont adoptés
          </p>
          <h2 className="font-display text-4xl font-semibold tracking-tight">
            Des mots doux de nos clients
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {avis.map((a) => (
            <figure
              key={a.author}
              className="flex flex-col rounded-blob bg-cream p-8 shadow-soft"
            >
              <div className="mb-4 text-terra" aria-label="5 étoiles sur 5">
                ✿ ✿ ✿ ✿ ✿
              </div>
              <blockquote className="flex-1 text-sm leading-relaxed text-ink-soft">
                « {a.text} »
              </blockquote>
              <figcaption className="mt-5 text-sm">
                <span className="font-bold">{a.author}</span>
                <span className="text-ink-faint"> — {a.product}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </>
  );
}
