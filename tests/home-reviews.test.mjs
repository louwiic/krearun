import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
function load(path, mocks = {}) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  const compiledModule = { exports: {} };
  new Function("require", "module", "exports", outputText)(name => mocks[name] ?? require(name), compiledModule, compiledModule.exports);
  return compiledModule.exports;
}
const HomeReviews = load("../components/home/HomeReviews.tsx").default;
const reviews = Array.from({ length: 5 }, (_, index) => ({
  id: `review-${index}`, productId: index ? "other-product" : "featured-product", productName: `Produit ${index}`,
  authorName: `Auteur ${index}`, email: "private@example.invalid", rating: 5,
  message: `Avis publié ${index}`, imageUrl: `/api/r2/review-${index}.webp`, approved: true,
}));
const pending = { ...reviews[0], id: "pending", authorName: "Non publié", message: "Avis en attente", approved: false, imageUrl: "/pending-photo.webp" };

test("all approved reviews show their photos and products, with no three-review limit or private emails", () => {
  const html = renderToStaticMarkup(createElement(HomeReviews, { reviews: [...reviews, pending] }));
  assert.equal((html.match(/data-review-id=/g) || []).length, 5);
  for (const review of reviews) {
    assert.ok(html.includes(review.authorName)); assert.ok(html.includes(review.imageUrl)); assert.ok(html.includes(review.productName));
  }
  assert.ok(!html.includes(pending.message)); assert.ok(!html.includes(pending.imageUrl)); assert.ok(!html.includes("private@example.invalid"));
});

test("both homepage modes retain approved reviews for products other than the featured product", async () => {
  for (const mode of ["single_product", "catalog"]) {
    const Page = load("../app/(site)/page.tsx", {
      "@/lib/seo": load("../lib/seo.ts"),
      "@/lib/legal": { BUSINESS: {} },
      "next/link": ({ children, ...props }) => createElement("a", props, children),
      "@/components/home/HomeReviews": HomeReviews,
      "@/components/home/SingleProductHome": ({ reviews }) => createElement(HomeReviews, { reviews }),
      "@/components/product/ProductCard": () => null,
      "@/lib/store": { getProducts: async () => [{ id: "featured-product", slug: "featured", category: "deco", featured: true }], getSettings: async () => ({ homepage_mode: mode, homepage_featured_product_slug: "featured" }), getApprovedReviews: async () => reviews },
      "@/lib/categories": { getVisibleCategories: () => [{ value: "deco" }] },
    }).default;
    const html = renderToStaticMarkup(await Page());
    assert.equal((html.match(/data-review-id=/g) || []).length, reviews.length, mode);
    assert.ok(html.includes("Avis publié 4"));
  }
});

test("approved review retrieval loads subsequent pages and keeps the approval and product filters", async () => {
  const source = ts.createSourceFile("store.ts", readFileSync(new URL("../lib/store.ts", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true);
  const fn = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "getApprovedReviews");
  const { outputText } = ts.transpileModule(fn.getText(source), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const requests = [], compiledModule = { exports: {} };
  new Function("module", "exports", "pb", "mapReview", "escapeFilter", outputText)(compiledModule, compiledModule.exports, async url => {
    requests.push(url); return { items: [{ id: `page-${requests.length}` }], totalPages: 2 };
  }, item => item, value => value);
  const result = await compiledModule.exports.getApprovedReviews("featured-product");
  assert.deepEqual(result.map(item => item.id), ["page-1", "page-2"]);
  for (const [index, url] of requests.entries()) {
    assert.ok(url.includes(`page=${index + 1}`));
    const filter = new URL(url, "https://example.invalid").searchParams.get("filter");
    assert.ok(filter.includes("approved=true")); assert.ok(filter.includes("featured-product"));
  }
});
