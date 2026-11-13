import { getProducts } from "@/lib/store";
import { siteOrigin } from "@/lib/seo";
import { CATEGORIES } from "@/lib/types";
import type { Product } from "@/lib/types";

// Suggestions produits pour le parcours guidé de la boutique en temps réel.
// Un produit est « simple » s'il peut partir au panier sans configuration ;
// les autres (variantes, personnalisation, cas spéciaux) renvoient à la fiche.
const SPECIAL_SLUGS = new Set(["porte-canette-monster", "lampe-lettre-personnalisee", "porte-cles-prenom", "clicker-studio"]);

const globalState = globalThis as unknown as { __liveSuggestions?: { products: Product[]; until: number } };

async function activeProducts(): Promise<Product[]> {
  const cached = globalState.__liveSuggestions;
  if (cached && cached.until > Date.now()) return cached.products;
  const products = (await getProducts()).filter(product => product.active);
  globalState.__liveSuggestions = { products, until: Date.now() + 5 * 60_000 };
  return products;
}

function isSimple(product: Product): boolean {
  return !SPECIAL_SLUGS.has(product.slug)
    && product.variants.filter(variant => variant.active).length === 0
    && !product.namePersonalizationEnabled
    && product.colors.length <= 1
    && product.stock > 0;
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site") return new Response(null, { status: 403 });
  if (origin && ![new URL(request.url).origin, siteOrigin()].includes(origin)) return new Response(null, { status: 403 });
  const category = new URL(request.url).searchParams.get("categorie") ?? "";
  if (!CATEGORIES.some(entry => entry.value === category)) return Response.json({ products: [] }, { headers: { "Cache-Control": "private, no-store" } });
  try {
    const products = (await activeProducts())
      .filter(product => product.category === category)
      .sort((a, b) => Number(b.featured) - Number(a.featured))
      .slice(0, 8)
      .map(product => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0] ?? "",
        priceCents: product.priceCents,
        color: product.colors[0]?.name ?? "",
        stock: product.stock,
        weightGrams: product.weightGrams,
        preorder: product.preorder,
        simple: isSimple(product),
      }));
    return Response.json({ products }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return new Response(null, { status: 503 });
  }
}
