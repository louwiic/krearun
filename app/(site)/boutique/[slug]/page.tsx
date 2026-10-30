import Link from "next/link";
import { productDescription, productStructuredData, productBreadcrumb, jsonLdString } from "@/lib/seo";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import NosProductGallery from "@/components/product/NosProductGallery";
import { NOS_SLUG, NOS_COLORS } from "@/lib/nos";
import Gallery from "@/components/product/Gallery";
import AddToCart from "@/components/product/AddToCart";
import ProductCard from "@/components/product/ProductCard";
import ReviewForm from "@/components/product/ReviewForm";
import { getApprovedReviews, getProductBySlug, getProducts, getSettings } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { hasFreeShipping } from "@/lib/free-shipping";
import { publicProductCopy } from "@/lib/public-copy";
import { formatWeight } from "@/lib/shipping";
import { getVisibleCategories } from "@/lib/categories";
import { HOLDER_SLUG } from "@/lib/custom-holder";
import CustomHolderProduct from "@/components/custom-holder/CustomHolderProduct";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
  const visibleCategories = getVisibleCategories(settings.categories_json);
  if (!product || !product.active || (!product.privateSale && !visibleCategories.some((category) => category.value === product.category))) {
    return { title: "Objet introuvable" };
  }
  return {
    title: product.name,
    robots: product.privateSale ? { index: false, follow: false } : undefined,
    description: productDescription(product),
    alternates: { canonical: `/boutique/${product.slug}` },
    openGraph: {
      title: product.name,
      description: productDescription(product),
      url: `/boutique/${product.slug}`,
      images: product.images[0] ? [{ url: product.images[0] }] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
  const categories = getVisibleCategories(settings.categories_json);
  if (
    !product ||
    !product.active ||
    (!product.privateSale && !categories.some((category) => category.value === product.category))
  ) notFound();

  if (slug === HOLDER_SLUG) return <><div data-product-view={product.id} aria-hidden className="h-px"/><CustomHolderProduct /></>;

  const [all, reviews] = await Promise.all([
    getProducts(),
    product.privateSale ? Promise.resolve([]) : getApprovedReviews(product.id),
  ]);
  const related = all
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);
  const categoryLabel =
    categories.find((c) => c.value === product.category)?.label ?? product.category;
  const activeVariants = product.variants.filter((variant) => variant.active);
  const variantPrices = activeVariants.map((variant) => variant.priceCents || product.priceCents);
  const displayPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : product.priceCents;

  const jsonLd = [productStructuredData(product, categoryLabel, reviews), productBreadcrumb(product, categoryLabel)];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      {!product.privateSale && <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }}
      />}
      {product.privateSale && <p className="mb-5 rounded-2xl border border-sand bg-white p-4 text-sm font-semibold">Votre création sur mesure — préparée selon votre demande.</p>}
      <nav data-product-view={product.id} className="mb-5 truncate text-xs text-ink-faint sm:mb-8 sm:text-sm">
        <Link href="/boutique" className="hover:text-terra">
          Boutique
        </Link>
        <span className="mx-2">·</span>
        <Link
          href={`/boutique?categorie=${product.category}`}
          className="hover:text-terra"
        >
          {categoryLabel}
        </Link>
        <span className="mx-2">·</span>
        <span className="text-ink-soft">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-10">
        {product.slug === NOS_SLUG ? <NosProductGallery images={product.images} videoUrl={product.videoUrl} name={product.name} initialColor={product.colors[0] || NOS_COLORS[0]} /> : <Gallery
          images={[
            ...(product.images.length ? product.images : product.privateSale ? ["/products/sur-mesure.svg"] : []),
            ...product.variants.map((variant) => variant.image).filter(Boolean),
          ].filter((image, index, images) => images.indexOf(image) === index)}
          videoUrl={product.videoUrl}
          name={product.name}
        />}

        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {product.preorder && (
              <span className="inline-block rounded-full bg-terra px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cream">
                Pré-commande · bientôt disponible
              </span>
            )}
            {product.isNew && !product.preorder && (
              <span className="inline-block rounded-full bg-sage px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cream">
                Nouveau
              </span>
            )}
            {hasFreeShipping(product.slug) && (
              <span className="inline-block rounded-full bg-cream px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-terra-deep">
                Livraison offerte
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-2 text-base italic text-ink-soft sm:text-lg">
            {publicProductCopy(product.tagline)}
          </p>

          <div className="mt-5 flex items-baseline gap-3">
            <p className="font-display text-2xl font-semibold sm:text-3xl">
              {variantPrices.length > 1 && <span className="mr-2 text-base text-ink-soft">Dès</span>}
              {formatPrice(displayPrice)}
            </p>
            {product.compareAtCents && (
              <p className="text-lg text-ink-faint line-through">
                {formatPrice(product.compareAtCents)}
              </p>
            )}
          </div>

          <div className="mt-6 sm:mt-8">
            <AddToCart product={product} />
          </div>
          {product.category === "noel" && product.slug.startsWith("noel-thermoforme-") && <aside className="mt-6 rounded-2xl border border-sand p-5 text-sm leading-relaxed">
            <h2 className="font-display text-xl font-bold">Deux façons de créer Noël.</h2>
            <p className="mt-3"><strong>Kit complet :</strong> pièces plates, moules réutilisables, connecteurs et cordon. Sèche-cheveux non fourni.</p>
            <p className="mt-2"><strong>Déjà thermoformée :</strong> décoration mise en forme et assemblée à l’atelier, avec son cordon. Moules non inclus.</p>
            <Link href="/tutoriels/boules-noel-thermoformees" className="mt-4 inline-block font-bold underline underline-offset-4">Voir le tutoriel de fabrication ↗</Link>
            <p className="mt-4 text-xs text-ink-soft">Visuel d’illustration du résultat final. Les teintes et le maillage peuvent varier selon l’impression. Décoration vendue vide, sans bonbons ni guirlande.</p>
          </aside>}

          <div className="mt-8 space-y-4 border-t border-sand/70 pt-6 sm:mt-10 sm:pt-8">
            {publicProductCopy(product.description).split("\n\n").map((para, i) => (
              <p
                key={i}
                className="whitespace-pre-line text-sm leading-relaxed text-ink-soft"
              >
                {para}
              </p>
            ))}
          </div>

          <div className="mt-8 grid gap-3 rounded-blob bg-cream p-5 text-sm shadow-soft sm:p-6">
            {[
              [
                "⏳",
                product.category === "lunette"
                  ? "Votre paire est préparée avec soin avant l’envoi"
                  : product.preorder
                  ? "Pré-commande — fabrication au lancement du prochain lot"
                  : "Fabriqué à la commande — 2 à 4 jours de préparation",
              ],
              ["🚚", hasFreeShipping(product.slug) ? "Livraison offerte sur ce produit" : "Préparé avec soin, suivi inclus"],
              ...(product.category === "lunette" ? [] : [
                ["⚖️", `Poids colis estimé : ${formatWeight(product.weightGrams)}`],
                ["💚", "Matière légère, emballage recyclé et recyclable"],
              ]),
            ].map(([icon, text]) => (
              <p key={text as string} className="flex items-center gap-3 text-ink-soft">
                <span>{icon}</span> {text}
              </p>
            ))}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16 sm:mt-24">
          <h2 className="mb-5 font-display text-2xl font-semibold sm:mb-8">
            Dans le même univers
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {!product.privateSale && <section className="mt-16 grid gap-8 sm:mt-24 lg:grid-cols-[1fr_0.9fr]">
        <div className="min-w-0">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-terra sm:text-xs sm:tracking-[0.18em]">
            Avis clients
          </p>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Votre retour nous aide à progresser
          </h2>
          {reviews.length > 0 ? (
            <div className="mt-6 grid gap-4">
              {reviews.map((review) => (
                <figure key={review.id} className="rounded-blob bg-cream p-6 shadow-soft">
                  <div className="mb-3 text-terra" aria-label={`${review.rating} sur 5`}>
                    {"✿ ".repeat(review.rating).trim()}
                  </div>
                  <blockquote className="break-words text-base leading-relaxed text-ink-soft">
                    « {review.message} »
                  </blockquote>
                  {review.imageUrl && (
                    <a href={review.imageUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={review.imageUrl} alt={`Photo de l’avis de ${review.authorName}`} className="max-h-64 max-w-full rounded-2xl border border-sand object-contain" />
                    </a>
                  )}
                  <figcaption className="mt-4 text-sm font-bold">
                    {review.authorName}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-soft">
              Aucun avis publié pour ce produit pour le moment.
            </p>
          )}
        </div>
        <ReviewForm productId={product.id} productName={product.name} />
      </section>}
    </div>
  );
}
