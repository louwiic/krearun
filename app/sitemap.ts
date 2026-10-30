import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/seo";
import { getProducts, getSettings } from "@/lib/store";
import { getVisibleCategories } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteOrigin();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/boutique`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/personnaliser`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/newsletter`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/clicker-studio`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/lettre-personnalisee`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/avis`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/cgu`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/retractation`, changeFrequency: "yearly", priority: 0.3 },
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
    .filter((product) => product.active && !product.privateSale && visibleValues.has(product.category))
    .map((p) => ({
    url: `${base}/boutique/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
    }));

  return [...staticPages, ...(products.some(product => product.isNew && product.active && !product.privateSale && visibleValues.has(product.category)) ? [{ url: `${base}/boutique?nouveautes=1`, changeFrequency: "weekly" as const, priority: 0.7 }] : []), ...categoryPages, ...productPages];
}
