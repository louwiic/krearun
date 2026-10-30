import type { Product, Review } from "./types";

/** One public origin for metadata, structured data and discovery files. */
export function siteOrigin(): string {
  const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://krearun.re");
  if (url.hostname === "krearun.re" || url.hostname.endsWith(".krearun.re")) return "https://krearun.re";
  return url.origin;
}

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  veilleuses: "Découvrez nos veilleuses et lampes personnalisées, préparées dans notre atelier à La Réunion. Choisissez un modèle et composez un cadeau à votre image.",
  bureau: "Des accessoires pour votre bureau, préparés par Kréarun à La Réunion. Découvrez les modèles disponibles pour organiser et personnaliser votre espace.",
  rangement: "Découvrez les objets de rangement Kréarun pour organiser votre quotidien. Des créations préparées avec soin dans notre atelier à La Réunion.",
  deco: "Découvrez les objets de décoration Kréarun et trouvez une idée cadeau pour votre intérieur. Des créations préparées dans notre atelier à La Réunion.",
  "porte-boisson": "Porte-canettes Monster, Red Bull, NOS et porte-boisson personnalisé : choisissez votre modèle et vos couleurs. Fabrication dans notre atelier à La Réunion.",
  lunette: "Découvrez nos lunettes et choisissez votre monture préférée. La paire à 15,90 € avec livraison offerte : retrouvez les modèles disponibles en boutique.",
  noel: "Préparez Noël avec nos décorations thermoformées : choisissez un kit créatif avec moules réutilisables ou une décoration déjà mise en forme dans notre atelier.",
};
export const SHOP_DESCRIPTION = "Découvrez la boutique Kréarun à La Réunion : porte-boissons, lampes personnalisées, décoration et accessoires. Choisissez votre création ou une idée cadeau.";

export function productDescription(product: Pick<Product, "slug" | "name" | "description" | "tagline">): string {
  const descriptions: Record<string, string> = {
    "porte-canette-monster": "Porte-canette Monster avec ou sans griffes 3D. Choisissez vos couleurs et ajoutez un prénom en option. Fabriqué à la commande à La Réunion par Kréarun.",
    "porte-canette-red-bull": "Découvrez le porte-canette Red Bull Kréarun. Choisissez vos couleurs et personnalisez votre modèle avec un prénom en option. Fabriqué à La Réunion.",
    "porte-boisson-nos-500ml": "Porte-boisson NOS pour canette de 500 ml, personnalisable avec un texte ou votre logo. Choisissez votre couleur et découvrez l’aperçu 3D avant de commander.",
    "porte-boisson-500ml-personnalise": "Créez votre porte-boisson 500 ml avec votre logo, vos couleurs et vos textes. Aperçu 3D et validation par notre atelier à La Réunion avant le paiement.",
  };
  if (descriptions[product.slug]) return descriptions[product.slug];
  const text = `${product.name} : ${product.description || product.tagline}`.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (text.length <= 160) return text;
  return text.slice(0, 157).replace(/\s+\S*$/, "") + "…";
}

export function jsonLdString(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function productStructuredData(product: Product, categoryLabel: string, reviews: Review[]) {
  const url = `${siteOrigin()}/boutique/${product.slug}`;
  const variants = product.variants.filter(variant => variant.active);
  const prices = variants.map(variant => variant.priceCents || product.priceCents);
  const stock = variants.length ? variants.reduce((sum, variant) => sum + variant.stock, 0) : product.stock;
  const approved = reviews.filter(review => review.approved && review.productId === product.id && review.rating >= 1 && review.rating <= 5);
  return {
    "@context": "https://schema.org", "@type": "Product",
    name: product.name, description: productDescription(product), sku: product.id,
    image: product.images.map(image => new URL(image, siteOrigin()).href), url, category: categoryLabel,
    brand: { "@type": "Brand", name: "Kréarun" },
    offers: {
      "@type": "Offer", price: ((prices.length ? Math.min(...prices) : product.priceCents) / 100).toFixed(2),
      priceCurrency: "EUR", itemCondition: "https://schema.org/NewCondition",
      availability: `https://schema.org/${product.preorder ? "PreOrder" : stock > 0 ? "InStock" : "OutOfStock"}`, url,
    },
    ...(approved.length ? {
      aggregateRating: { "@type": "AggregateRating", ratingValue: Number((approved.reduce((sum, review) => sum + review.rating, 0) / approved.length).toFixed(2)), reviewCount: approved.length },
      review: approved.map(review => ({ "@type": "Review", author: { "@type": "Person", name: review.authorName }, reviewBody: review.message, reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5 } })),
    } : {}),
  };
}

export function productBreadcrumb(product: Pick<Product, "name" | "slug" | "category">, categoryLabel: string) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Boutique", item: `${siteOrigin()}/boutique` },
    { "@type": "ListItem", position: 2, name: categoryLabel, item: `${siteOrigin()}/boutique?categorie=${encodeURIComponent(product.category)}` },
    { "@type": "ListItem", position: 3, name: product.name, item: `${siteOrigin()}/boutique/${product.slug}` },
  ] };
}
