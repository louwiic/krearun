import type { MetadataRoute } from "next";
import { getProducts, getSettings } from "@/lib/store";
import { getVisibleCategories } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/boutique`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/suivi`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/cgv`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/confidentialite`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/mentions-legales`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const [products, settings] = await Promise.all([
    getProducts().catch(() => []),
    getSettings(),
  ]);
  const categories = getVisibleCategories(settings.categories_json);
  const visibleValues = new Set(categories.map((category) => category.value));

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/boutique?categorie=${c.value}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const productPages: MetadataRoute.Sitemap = products
    .filter((product) => visibleValues.has(product.category))
    .map((p) => ({
    url: `${base}/boutique/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
    }));

  return [...staticPages, ...categoryPages, ...productPages];
}
