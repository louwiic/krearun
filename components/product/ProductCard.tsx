import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { publicColorName } from "@/lib/colors";
import { hasFreeShipping } from "@/lib/free-shipping";
import { publicProductCopy } from "@/lib/public-copy";

export default function ProductCard({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  const soldOut = product.stock <= 0 && !product.preorder;

  return (
    <Link
      href={`/boutique/${product.slug}`}
      className={`group block ${className}`}
    >
      <div className="relative overflow-hidden rounded-blob bg-cream shadow-soft transition-shadow duration-300 group-hover:shadow-lifted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images[0] ?? "/products/hero.svg"}
          alt={product.name}
          className="aspect-square w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
        {product.images[1] && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={product.images[1]}
            alt=""
            aria-hidden
            className="absolute inset-0 aspect-square w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}
        {product.videoUrl && (
          <span className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cream sm:bottom-4 sm:right-4 sm:px-3 sm:text-[11px]">
            Vidéo
          </span>
        )}
        <div className="absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1.5 sm:left-4 sm:top-4 sm:gap-2">
          {product.preorder && (
            <span className="rounded-full bg-terra px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cream sm:px-3 sm:text-[11px]">
              Pré-commande
            </span>
          )}
          {product.isNew && !soldOut && !product.preorder && (
            <span className="rounded-full bg-sage px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cream sm:px-3 sm:text-[11px]">
              Nouveau
            </span>
          )}
          {product.compareAtCents && !soldOut && (
            <span className="rounded-full bg-blush-deep px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cream sm:px-3 sm:text-[11px]">
              Petit prix
            </span>
          )}
          {hasFreeShipping(product.slug) && !soldOut && (
            <span className="rounded-full bg-cream px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-terra-deep sm:px-3 sm:text-[11px]">
              Livraison offerte
            </span>
          )}
          {soldOut && (
            <span className="rounded-full bg-ink/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cream sm:px-3 sm:text-[11px]">
              Épuisé
            </span>
          )}
        </div>
        {product.colors.length > 0 && (
          <div className="absolute bottom-3 left-3 flex gap-1 sm:bottom-4 sm:left-4 sm:gap-1.5">
            {product.colors.map((c) => (
              <span
                key={c.name}
                title={publicColorName(c.name)}
                className="h-3.5 w-3.5 rounded-full border border-cream shadow-sm sm:h-4 sm:w-4"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-col gap-1 px-1 sm:mt-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold leading-snug group-hover:text-terra sm:text-lg">
            {product.name}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-ink-soft sm:text-sm">
            {publicProductCopy(product.tagline)}
          </p>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="text-sm font-bold sm:text-base">{formatPrice(product.priceCents)}</p>
          {product.compareAtCents && (
            <p className="text-xs text-ink-faint line-through">
              {formatPrice(product.compareAtCents)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
