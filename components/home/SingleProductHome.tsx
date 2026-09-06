import Link from "next/link";
import SingleProductGallery from "@/components/home/SingleProductGallery";
import AddToCart from "@/components/product/AddToCart";
import { formatPrice } from "@/lib/format";
import { hasFreeShipping } from "@/lib/free-shipping";
import { publicProductCopy } from "@/lib/public-copy";
import type { Product, Review, Settings } from "@/lib/types";

export default function SingleProductHome({
  product,
  settings,
  reviews,
}: {
  product: Product;
  settings: Settings;
  reviews: Review[];
}) {
  const productHref = `/boutique/${product.slug}`;
  const heroImages = [
    settings.hero_image_url,
    ...product.images,
    ...product.variants.map((variant) => variant.image),
  ].filter(
    (image, index, images): image is string => Boolean(image) && images.indexOf(image) === index
  );
  const videoUrl = settings.hero_secondary_media_url || product.videoUrl;
  const videoIsVideo =
    settings.hero_secondary_media_type === "video" ||
    /\.(mp4|webm|mov)(\?|#|$)/i.test(videoUrl);
  const description = publicProductCopy(product.description);
  const activeVariants = product.variants.filter((variant) => variant.active);
  const variantPrices = activeVariants.map((variant) => variant.priceCents || product.priceCents);
  const displayPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : product.priceCents;

  return (
    <>
      <section className="relative overflow-hidden border-b-2 border-ink bg-linen">
        <div aria-hidden className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#00c8b8]/15 blur-3xl" />
        <div aria-hidden className="absolute -bottom-48 -left-28 h-96 w-96 rounded-full bg-terra/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12 lg:py-14">
          <div className="order-2 lg:order-1">
            <p className="mb-4 inline-flex items-center gap-2 border-2 border-ink bg-[#00c8b8] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-ink">
              <span className="h-2 w-2 animate-pulse rounded-full bg-ink" />
              Le produit vedette
            </p>
            <h1 className="font-display text-5xl uppercase leading-[0.86] text-ink sm:text-6xl lg:text-[4rem]">
              {product.name}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
              {publicProductCopy(product.tagline)}
            </p>

            <div className="mt-6 flex items-end gap-3 border-b-2 border-ink/15 pb-6">
              <span className="font-display text-4xl leading-none text-ink sm:text-5xl">
                {variantPrices.length > 1 && <span className="mr-2 text-base">Dès</span>}
                {formatPrice(displayPrice)}
              </span>
              {product.compareAtCents ? (
                <span className="pb-1 text-lg text-ink-faint line-through">
                  {formatPrice(product.compareAtCents)}
                </span>
              ) : null}
            </div>

            <div className="mt-6 max-w-xl">
              <AddToCart product={product} />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 text-xs font-bold uppercase tracking-[0.06em] text-ink-soft sm:grid-cols-3">
              <span>✓ Fabriqué péi</span>
              <span>✓ Paiement sécurisé</span>
              <span className="col-span-2 sm:col-span-1">
                ✓ {hasFreeShipping(product.slug) ? "Livraison offerte" : "Suivi inclus"}
              </span>
            </div>
          </div>

          <div className="order-1 mx-auto w-full max-w-md lg:order-2 lg:mx-0 lg:justify-self-end">
            <SingleProductGallery images={heroImages} name={product.name} />
          </div>
        </div>
      </section>

      <section className="border-b-2 border-ink bg-ink text-cream">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-12">
          <div className="mx-auto w-full max-w-md overflow-hidden border-2 border-cream/20 bg-black shadow-hard-terra lg:mx-0">
            {videoUrl ? (
              videoIsVideo ? (
                <video
                  src={videoUrl}
                  className="aspect-[4/5] w-full object-cover sm:aspect-video lg:aspect-[4/5] lg:max-h-[560px]"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  aria-label={settings.hero_secondary_media_alt || `Vidéo de ${product.name}`}
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={videoUrl}
                  alt={settings.hero_secondary_media_alt || product.name}
                  className="aspect-[4/5] w-full object-cover sm:aspect-video lg:aspect-[4/5] lg:max-h-[560px]"
                />
              )
            ) : (
              <div className="flex aspect-video items-center justify-center text-sm text-cream/50">
                Ajoutez une vidéo depuis le back-office
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#00c8b8]">
              Pensé pour t’accompagner
            </p>
            <h2 className="mt-3 font-display text-4xl uppercase leading-[0.9] sm:text-5xl">
              Le produit en action
            </h2>
            <div className="mt-7 space-y-4">
              {description.split(/\r?\n\r?\n/).map((paragraph) => (
                <p key={paragraph} className="whitespace-pre-line text-sm leading-7 text-cream/72 sm:text-base">
                  {paragraph}
                </p>
              ))}
            </div>
            <Link
              href={productHref}
              className="mt-8 inline-flex border-2 border-cream bg-[#00c8b8] px-7 py-3.5 text-sm font-bold uppercase tracking-[0.06em] text-ink transition-colors hover:bg-cream"
            >
              Voir la fiche complète →
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b-2 border-ink bg-[#00c8b8] text-ink">
        <div className="mx-auto grid max-w-6xl divide-y-2 divide-ink px-4 sm:px-6 md:grid-cols-3 md:divide-x-2 md:divide-y-0">
          {[
            ["01", "Choisis", "Sélectionne ton coloris et ta quantité."],
            ["02", "On fabrique", "Chaque pièce est préparée avec soin dans notre atelier."],
            ["03", "Tu profites", "Ta commande est emballée puis expédiée avec suivi."],
          ].map(([number, title, text]) => (
            <div key={number} className="flex gap-4 py-6 md:px-6 md:py-7">
              <span className="font-display text-3xl leading-none">{number}</span>
              <div>
                <h3 className="font-display text-xl uppercase leading-none">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {reviews.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-18">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-terra">Avis clients</p>
          <h2 className="mt-3 font-display text-4xl uppercase leading-[0.9] sm:text-5xl">
            Ils l’ont adopté
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {reviews.slice(0, 3).map((review) => (
              <figure key={review.id} className="border-2 border-ink bg-cream p-7 shadow-hard">
                <div className="mb-4 text-terra" aria-label={`${review.rating} sur 5`}>
                  {"★ ".repeat(review.rating).trim()}
                </div>
                <blockquote className="text-sm leading-relaxed text-ink-soft">
                  « {review.message} »
                </blockquote>
                <figcaption className="mt-5 font-display text-base uppercase">
                  {review.authorName}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
