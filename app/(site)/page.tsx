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
      <section className="relative overflow-hidden bg-gradient-to-br from-cream via-linen to-blush/30">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blush/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-40 h-80 w-80 rounded-full bg-sage/30 blur-3xl"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-12 pt-8 sm:px-6 sm:pb-20 sm:pt-16 md:grid-cols-2 md:gap-12 md:pt-20">
          <div>
            <p className="reveal mb-4 inline-flex items-center gap-2 rounded-full bg-sage/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-sage-deep sm:px-4 sm:text-xs sm:tracking-[0.15em]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-terra" />
              Créé et fabriqué à La Réunion
            </p>
            <h1 className="reveal reveal-1 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Nos derniers
              <br />
              <em className="text-terra">produits du moment</em>
            </h1>
            <p className="reveal reveal-2 mt-5 max-w-md text-base leading-relaxed text-ink-soft sm:mt-6 sm:text-lg">
              Repérez votre coup de cœur, choisissez votre couleur et recevez
              une création préparée spécialement pour vous.
            </p>
            <div className="reveal reveal-3 mt-7 grid gap-3 sm:mt-9 sm:flex sm:flex-wrap sm:gap-4">
              <Link
                href={heroHref}
                className="rounded-full bg-terra-deep px-6 py-3.5 text-center text-sm font-bold text-cream shadow-soft transition-all hover:-translate-y-0.5 hover:bg-ink hover:shadow-lifted sm:px-8 sm:py-4"
              >
                Je veux ce produit
              </Link>
              <Link
                href="/boutique"
                className="rounded-full border border-sand bg-cream px-6 py-3.5 text-center text-sm font-bold text-ink transition-colors hover:border-terra hover:text-terra sm:px-8 sm:py-4"
              >
                Voir tous les produits
              </Link>
            </div>
            <p className="reveal reveal-3 mt-4 text-center text-xs font-semibold text-ink-faint sm:text-left">
              Paiement sécurisé · Livraison sur toute l’île
            </p>
          </div>

          <div className="reveal reveal-2 relative">
            {heroImage && (
              <Link
                href={heroHref}
                className="group relative block animate-float overflow-hidden rounded-[2rem] shadow-lifted sm:rounded-[3rem]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroImage}
                  alt={heroAlt}
                  className="aspect-square w-full object-cover"
                />
                {heroMain && (
                  <span className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-2xl bg-cream/95 p-3.5 shadow-soft backdrop-blur sm:inset-x-5 sm:bottom-5 sm:p-4">
                    <span className="min-w-0">
                      <span className="block truncate font-display font-semibold text-ink">
                        {heroMain.name}
                      </span>
                      <span className="mt-0.5 block text-sm font-bold text-terra-deep">
                        {formatPrice(heroMain.priceCents)}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-terra-deep px-4 py-2.5 text-xs font-bold text-cream transition-transform group-hover:scale-105 sm:text-sm">
                      Découvrir →
                    </span>
                  </span>
                )}
              </Link>
            )}
            {secondaryMedia && (
              <Link
                href={secondaryHref}
                className="animate-drift absolute -bottom-8 -left-8 hidden w-40 overflow-hidden rounded-[2rem] border-4 border-linen shadow-lifted sm:block"
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
            <p className="absolute -right-2 top-6 hidden rotate-6 rounded-2xl bg-cream px-4 py-2 font-display text-sm italic text-ink-soft shadow-soft md:block">
              le coup de cœur du moment ✿
            </p>
          </div>
        </div>
      </section>

      {/* ── Bande réassurance ────────────────────────── */}
      <section className="border-y border-ink/10 bg-ink text-cream">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 py-6 sm:px-6 sm:py-8 md:grid-cols-3">
          {[
            ["📍", "Fabriqué à La Réunion", "Une création locale préparée avec soin."],
            ["🔒", "Paiement sécurisé", "Commandez simplement et en toute confiance."],
            ["📦", "Livraison sur toute l’île", "Votre commande arrive directement chez vous."],
          ].map(([icon, title, text]) => (
            <div key={title as string} className="flex items-start gap-4">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-display font-semibold">{title}</p>
                <p className="mt-1 text-sm text-cream/70">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Nouveautés ───────────────────────────────── */}
      {nouveautes.length > 0 && (
        <section className="mx-auto mt-10 max-w-6xl rounded-[2rem] bg-cream px-4 py-10 shadow-soft sm:mt-16 sm:rounded-[3rem] sm:px-8 sm:py-14">
          <div className="mb-6 flex items-end justify-between sm:mb-10">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-terra-deep sm:text-xs sm:tracking-[0.18em]">
                À découvrir maintenant
              </p>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Les créations qui font craquer
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft sm:text-base">
                Cliquez sur votre préférée pour choisir les détails et commander.
              </p>
            </div>
            <Link
              href="/boutique"
              className="nav-link hidden text-sm font-bold text-ink-soft hover:text-ink sm:block"
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
        <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 sm:pt-20">
          <div className="mb-6 sm:mb-10">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-sage-deep sm:text-xs sm:tracking-[0.18em]">
              Vous hésitez encore ?
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Les favoris de nos clients
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
          <div className="mb-8 text-center sm:mb-10">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-terra sm:text-xs sm:tracking-[0.18em]">
              Avis vérifiés
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Retours clients
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {reviews.slice(0, 3).map((review) => (
              <figure
                key={review.id}
                className="flex flex-col rounded-blob bg-cream p-8 shadow-soft"
              >
                <div className="mb-4 text-terra" aria-label={`${review.rating} sur 5`}>
                  {"✿ ".repeat(review.rating).trim()}
                </div>
                <blockquote className="flex-1 text-sm leading-relaxed text-ink-soft">
                  « {review.message} »
                </blockquote>
                <figcaption className="mt-5 text-sm">
                  <span className="font-bold">{review.authorName}</span>
                  <span className="text-ink-faint"> — {review.productName}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-12 text-center text-cream shadow-lifted sm:rounded-[3rem] sm:px-12 sm:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-terra/30 blur-3xl"
          />
          <div className="relative mx-auto max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blush">
              Votre coup de cœur vous attend
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-5xl">
              Prêt à choisir votre création ?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-cream/75 sm:text-base">
              Découvrez les modèles disponibles et commandez celui qui vous ressemble.
            </p>
            <Link
              href="/boutique"
              className="mt-7 inline-flex items-center justify-center rounded-full bg-terra-deep px-8 py-4 text-sm font-bold text-cream shadow-soft transition-all hover:-translate-y-0.5 hover:bg-cream hover:text-ink hover:shadow-lifted"
            >
              Choisir mon produit
              <span aria-hidden className="ml-2">→</span>
            </Link>
          </div>
        </div>
      </section>

      <Link
        href="/boutique"
        className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-center rounded-full bg-terra-deep px-6 py-4 text-sm font-bold text-cream shadow-lifted md:hidden"
      >
        Voir les produits
        <span aria-hidden className="ml-2">→</span>
      </Link>
    </>
  );
}
