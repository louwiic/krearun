import { getProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
  };
}

function absoluteUrl(value: string, siteUrl: string) {
  if (!value) return "";
  try {
    return new URL(value, siteUrl).toString();
  } catch {
    return value;
  }
}

export async function GET(request: Request) {
  const products = await getProducts({ partnerSharedOnly: true });
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");

  return Response.json(
    {
      version: 1,
      generatedAt: new Date().toISOString(),
      count: products.length,
      products: products.map((product) => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        tagline: product.tagline,
        description: product.description,
        category: product.category,
        priceCents: product.priceCents,
        price: product.priceCents / 100,
        currency: "EUR",
        compareAtCents: product.compareAtCents ?? null,
        images: product.images.map((image) => absoluteUrl(image, siteUrl)),
        videoUrl: absoluteUrl(product.videoUrl, siteUrl),
        colors: product.colors,
        available: product.stock > 0 || product.preorder,
        stock: product.stock,
        preorder: product.preorder,
        namePersonalizationEnabled: product.namePersonalizationEnabled,
        productUrl: `${siteUrl}/boutique/${product.slug}`,
        updatedAt: product.updatedAt,
      })),
    },
    { headers: corsHeaders() }
  );
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
