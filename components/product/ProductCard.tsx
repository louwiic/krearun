import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";

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
        <div className="absolute left-4 top-4 flex gap-2">
          {product.preorder && (
            <span className="rounded-full bg-terra px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cream">
              Pré-commande
            </span>
          )}
          {product.isNew && !soldOut && !product.preorder && (
            <span className="rounded-full bg-sage px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cream">
              Nouveau
            </span>
          )}
          {product.compareAtCents && !soldOut && (
            <span className="rounded-full bg-blush-deep px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cream">
              Petit prix
            </span>
          )}
          {soldOut && (
            <span className="rounded-full bg-ink/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cream">
              Épuisé
            </span>
          )}
        </div>
        {product.colors.length > 0 && (
          <div className="absolute bottom-4 left-4 flex gap-1.5">
            {product.colors.map((c) => (
              <span
                key={c.name}
                title={c.name}
                className="h-4 w-4 rounded-full border border-cream shadow-sm"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        )}
      </div>
      <div className="mt-4 flex items-start justify-between gap-3 px-1">
        <div>
          <h3 className="font-display text-lg font-semibold leading-snug group-hover:text-terra">
            {product.name}
          </h3>
          <p className="mt-0.5 text-sm text-ink-soft">{product.tagline}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-bold">{formatPrice(product.priceCents)}</p>
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
