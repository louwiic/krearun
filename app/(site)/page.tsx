import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import { formatPrice } from "@/lib/format";
import { getApprovedReviews, getProducts, getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, settings, reviews] = await Promise.all([
    getProducts(),
    getSettings(),
    getApprovedReviews(),
  ]);
  const featured = products.filter((p) => p.featured).slice(0, 4);
  const nouveautes = products.filter((p) => p.isNew).slice(0, 3);
  const heroMain = featured[0] ?? products[0];
  const heroSecond = featured.find((p) => p.id !== heroMain?.id) ?? products[1];
  const heroImage = settings.hero_image_url || heroMain?.images[0] || "/products/hero.svg";
  const heroAlt = settings.hero_image_alt || heroMain?.name || "Produit Krearun Studio";
  const heroHref = settings.hero_link_url || (heroMain ? `/boutique/${heroMain.slug}` : "/boutique");
  const secondaryMedia =
    settings.hero_secondary_media_url || heroSecond?.images[0] || "";
  const secondaryHref =
    settings.hero_secondary_link_url ||
    (heroSecond ? `/boutique/${heroSecond.slug}` : "/boutique");
  const secondaryIsVideo =
    settings.hero_secondary_media_type === "video" ||
    /\.(mp4|webm|mov)(\?|#|$)/i.test(secondaryMedia);

  return (
    <>
      {/* ── Héro ─────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b-2 border-ink bg-linen">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-28 -top-28 h-[24rem] w-[24rem] rotate-12 bg-terra/15"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 bottom-0 h-72 w-72 bg-sage/20"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-14 pt-10 sm:px-6 sm:pb-24 sm:pt-16 md:grid-cols-2 md:gap-12 md:pt-20">
          <div>
            <p className="reveal mb-5 inline-flex items-center gap-2 border-2 border-ink bg-cream px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink">
              <span className="h-2 w-2 animate-pulse bg-terra" />
              Fabriké péi · La Rényon
            </p>
            <h1 className="reveal reveal-1 font-display text-5xl uppercase leading-[0.9] text-ink sm:text-6xl lg:text-7xl">
              Des objets
              <br />
              qui ont du{" "}
              <span className="text-terra">karaktèr</span>
            </h1>
            <p className="reveal reveal-2 mt-6 max-w-md text-base leading-relaxed text-ink-soft sm:text-lg">
              Veilleuses, vases et déco imprimés en 3D dans notre atelier péi.
              Repère ton modèle, choisis ta couleur — et affiche le style.
            </p>
            <div className="reveal reveal-3 mt-8 grid gap-3 sm:flex sm:flex-wrap sm:gap-4">
              <Link
                href={heroHref}
                className="inline-flex items-center justify-center border-2 border-ink bg-ink px-7 py-3.5 text-center text-sm font-bold uppercase tracking-[0.06em] text-cream transition-all hover:bg-terra hover:border-terra sm:px-9 sm:py-4"
              >
                Je veux ça
                <span aria-hidden className="ml-2">→</span>
              </Link>
              <Link
                href="/boutique"
                className="inline-flex items-center justify-center border-2 border-ink bg-cream px-7 py-3.5 text-center text-sm font-bold uppercase tracking-[0.06em] text-ink transition-colors hover:bg-ink hover:text-cream sm:px-9 sm:py-4"
              >
                Voir la boutique
              </Link>
            </div>
            <p className="reveal reveal-3 mt-5 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint sm:text-left">
              Paiement sécurisé · Livraison partou dan lî
            </p>
          </div>

          <div className="reveal reveal-2 relative">
            {heroImage && (
              <Link
                href={heroHref}
                className="group relative block animate-float overflow-hidden border-2 border-ink shadow-hard"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroImage}
                  alt={heroAlt}
                  className="aspect-square w-full object-cover"
                />
                {heroMain && (
                  <span className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 border-2 border-ink bg-cream p-3 sm:inset-x-4 sm:bottom-4 sm:p-3.5">
                    <span className="min-w-0">
                      <span className="block truncate font-display text-lg uppercase leading-none text-ink">
                        {heroMain.name}
                      </span>
                      <span className="mt-1 block text-sm font-bold text-terra">
                        {formatPrice(heroMain.priceCents)}
                      </span>
                    </span>
                    <span className="shrink-0 bg-terra px-4 py-2.5 text-xs font-bold uppercase text-cream transition-transform group-hover:scale-105 sm:text-sm">
                      Voir →
                    </span>
                  </span>
                )}
              </Link>
            )}
            {secondaryMedia && (
              <Link
                href={secondaryHref}
                className="animate-drift absolute -bottom-7 -left-7 hidden w-40 overflow-hidden border-2 border-ink shadow-hard-terra sm:block"
              >
                {secondaryIsVideo ? (
                  <video
                    src={secondaryMedia}
                    className="aspect-square w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    aria-label={settings.hero_secondary_media_alt || "Vidéo produit"}
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={secondaryMedia}
                    alt={settings.hero_secondary_media_alt || heroSecond?.name || ""}
                    className="aspect-square w-full object-cover"
                  />
                )}
              </Link>
            )}
            <p className="absolute -right-3 top-5 hidden -rotate-3 border-2 border-ink bg-sage px-3 py-1.5 font-display text-sm uppercase text-ink shadow-hard md:block">
              Kok la fé péi ✦
            </p>
          </div>
        </div>
      </section>

      {/* ── Bande réassurance ────────────────────────── */}
      <section className="border-b-2 border-ink bg-ink text-cream">
        <div className="mx-auto grid max-w-6xl divide-y-2 divide-cream/15 px-4 sm:px-6 md:grid-cols-3 md:divide-x-2 md:divide-y-0">
          {[
            ["01", "Fabriké péi", "Chaque pièce sort de notre atelier à La Réunion."],
            ["02", "Paiement sécurisé", "Commande simple, en toute confiance."],
            ["03", "Livraison partou", "Ta commande arrive directement chez toi."],
          ].map(([num, title, text]) => (
            <div key={title} className="flex items-start gap-4 py-6 md:px-6 md:py-8">
              <span className="font-display text-3xl leading-none text-terra">{num}</span>
              <div>
                <p className="font-display text-lg uppercase leading-none">{title}</p>
                <p className="mt-2 text-sm text-cream/65">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Nouveautés ───────────────────────────────── */}
      {nouveautes.length > 0 && (
        <section className="mx-auto mt-12 max-w-6xl px-4 sm:mt-20 sm:px-6">
          <div className="mb-6 flex items-end justify-between sm:mb-10">
            <div>
              <span className="mb-3 inline-block border-2 border-ink bg-terra px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-cream">
                Nouveauté
              </span>
              <h2 className="font-display text-4xl uppercase leading-[0.9] sm:text-5xl">
                Frais sorti d’atelier
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft sm:text-base">
                Clique sur ta préférée pour choisir les détails et commander.
              </p>
            </div>
            <Link
              href="/boutique"
              className="nav-link hidden text-[13px] font-bold uppercase tracking-[0.08em] text-ink hover:text-terra sm:block"
            >
              Tout voir →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-3">
            {nouveautes.map((p) => (
              <ProductCard key={p.id} product={p} showCta />
            ))}
          </div>
        </section>
      )}

      {/* ── Coups de cœur ────────────────────────────── */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6 sm:pt-24">
          <div className="mb-6 sm:mb-10">
            <span className="mb-3 inline-block border-2 border-ink bg-sage px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink">
              Best-sellers
            </span>
            <h2 className="font-display text-4xl uppercase leading-[0.9] sm:text-5xl">
              Les favoris du péi
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} showCta />
            ))}
          </div>
        </section>
      )}

      {reviews.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6 sm:pt-24">
          <div className="mb-8 sm:mb-10">
            <span className="mb-3 inline-block border-2 border-ink bg-cream px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink">
              Avis vérifiés
            </span>
            <h2 className="font-display text-4xl uppercase leading-[0.9] sm:text-5xl">
              Zot i koz pou nou
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {reviews.slice(0, 3).map((review) => (
              <figure
                key={review.id}
                className="flex flex-col border-2 border-ink bg-cream p-7 shadow-hard"
              >
                <div className="mb-4 text-lg text-terra" aria-label={`${review.rating} sur 5`}>
                  {"★ ".repeat(review.rating).trim()}
                </div>
                <blockquote className="flex-1 text-sm leading-relaxed text-ink-soft">
                  « {review.message} »
                </blockquote>
                <figcaption className="mt-5 text-sm">
                  <span className="font-display text-base uppercase leading-none">{review.authorName}</span>
                  <span className="text-ink-faint"> — {review.productName}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="relative overflow-hidden border-2 border-ink bg-ink px-6 py-14 text-cream shadow-hard-terra sm:px-12 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rotate-12 bg-terra/25"
          />
          <div className="relative max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-terra">
              Ton coup de cœur t’attend
            </p>
            <h2 className="mt-3 font-display text-4xl uppercase leading-[0.9] sm:text-6xl">
              Alé, choisis ton objet
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-cream/70 sm:text-base">
              Découvre les modèles dispos et commande celui qui te ressemble.
            </p>
            <Link
              href="/boutique"
              className="mt-8 inline-flex items-center justify-center border-2 border-cream bg-terra px-8 py-4 text-sm font-bold uppercase tracking-[0.06em] text-cream transition-all hover:bg-cream hover:text-ink"
            >
              Choisir mon produit
              <span aria-hidden className="ml-2">→</span>
            </Link>
          </div>
        </div>
      </section>

      <Link
        href="/boutique"
        className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-center border-2 border-ink bg-terra px-6 py-4 text-sm font-bold uppercase tracking-[0.06em] text-cream shadow-hard md:hidden"
      >
        Voir les produits
        <span aria-hidden className="ml-2">→</span>
      </Link>
    </>
  );
}
