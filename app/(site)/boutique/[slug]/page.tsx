import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Gallery from "@/components/product/Gallery";
import AddToCart from "@/components/product/AddToCart";
import ProductCard from "@/components/product/ProductCard";
import { getProductBySlug, getProducts } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { CATEGORIES } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Objet introuvable" };
  return {
    title: product.name,
    description: product.tagline || product.description.slice(0, 155),
    alternates: { canonical: `/boutique/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.tagline,
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
  const product = await getProductBySlug(slug);
  if (!product || !product.active) notFound();

  const all = await getProducts();
  const related = all
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);
  const categoryLabel =
    CATEGORIES.find((c) => c.value === product.category)?.label ?? product.category;

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.tagline || product.description.slice(0, 200),
    image: product.images.map((img) =>
      img.startsWith("http") ? img : `${siteUrl}${img}`
    ),
    url: `${siteUrl}/boutique/${product.slug}`,
    category: categoryLabel,
    brand: { "@type": "Brand", name: "Cocon Studio" },
    offers: {
      "@type": "Offer",
      price: (product.priceCents / 100).toFixed(2),
      priceCurrency: "EUR",
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${siteUrl}/boutique/${product.slug}`,
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="mb-8 text-sm text-ink-faint">
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

      <div className="grid gap-12 md:grid-cols-2">
        <Gallery images={product.images} name={product.name} />

        <div>
          {product.isNew && (
            <span className="mb-4 inline-block rounded-full bg-sage px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cream">
              Nouveau
            </span>
          )}
          <h1 className="font-display text-4xl font-semibold tracking-tight">
            {product.name}
          </h1>
          <p className="mt-2 text-lg italic text-ink-soft">{product.tagline}</p>

          <div className="mt-5 flex items-baseline gap-3">
            <p className="font-display text-3xl font-semibold">
              {formatPrice(product.priceCents)}
            </p>
            {product.compareAtCents && (
              <p className="text-lg text-ink-faint line-through">
                {formatPrice(product.compareAtCents)}
              </p>
            )}
          </div>

          <div className="mt-8">
            <AddToCart product={product} />
          </div>

          <div className="mt-10 space-y-4 border-t border-sand/70 pt-8">
            {product.description.split("\n\n").map((para, i) => (
              <p
                key={i}
                className="whitespace-pre-line text-sm leading-relaxed text-ink-soft"
              >
                {para}
              </p>
            ))}
          </div>

          <div className="mt-8 grid gap-3 rounded-blob bg-cream p-6 text-sm shadow-soft">
            {[
              ["🖨️", "Imprimé à la commande — 2 à 4 jours de fabrication"],
              ["🚚", "Expédié en 48 h après impression, suivi inclus"],
              ["💚", "PLA biosourcé, emballage recyclé et recyclable"],
            ].map(([icon, text]) => (
              <p key={text as string} className="flex items-center gap-3 text-ink-soft">
                <span>{icon}</span> {text}
              </p>
            ))}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-8 font-display text-2xl font-semibold">
            Dans le même univers
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
