import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
function load(path, mocks = {}) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } });
  const mod = { exports: {} };
  new Function("require", "module", "exports", outputText)(name => mocks[name] ?? require(name), mod, mod.exports);
  return mod.exports;
}
const helpers = load("../lib/private-sales.ts", { "./format": { slugify: name => name.toLowerCase().replace(/ /g, "-") } });
function form(overrides = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ name: "Création Camille", description: "Texte et couleurs convenus", price: "45,90", stock: "1", weightGrams: "600", ...overrides })) data.set(key, value);
  return data;
}
test("prices, stock and shipping weight are validated before writing offers", () => {
  assert.deepEqual(helpers.parsePrivateSale(form()), { name: "Création Camille", description: "Texte et couleurs convenus", priceCents: 4590, stock: 1, weightGrams: 600 });
  for (const price of ["0", "-1", "NaN", "Infinity", "1e3", "12junk", "4.999", "100000"]) assert.throws(() => helpers.parsePrivateSale(form({ price })));
  for (const values of [{ stock: "0" }, { stock: "1.5" }, { weightGrams: "0" }, { weightGrams: "30001" }, { description: "" }]) assert.throws(() => helpers.parsePrivateSale(form(values)));
  assert.equal(helpers.parsePrivateSale(form({ stock: "0" }), true).stock, 0);
});
test("offer links have random tokens and remain stable when editing", () => {
  const first = helpers.privateSaleSlug("Creation");
  const second = helpers.privateSaleSlug("Creation");
  assert.match(first, /^creation-[a-f0-9]{24}$/);
  assert.notEqual(first, second);
  assert.equal(helpers.privateSaleSlug("Nouveau nom", first), first);
});
test("public catalog and partner feeds exclude offers while admins can list them", async () => {
  const source = ts.createSourceFile("store.ts", readFileSync(new URL("../lib/store.ts", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true);
  const fn = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "getProducts");
  const { outputText } = ts.transpileModule(fn.getText(source), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const urls = [], mod = { exports: {} };
  new Function("module", "exports", "pb", "mapProduct", outputText)(mod, mod.exports, async url => { urls.push(url); return { items: [] }; }, value => value);
  for (const opts of [undefined, { partnerSharedOnly: true }, { partnerSharedOnly: true, includeInactive: true }, { includeInactive: true }]) await mod.exports.getProducts(opts);
  const filters = urls.map(url => new URL(url, "https://test.invalid").searchParams.get("filter") || "");
  for (const filter of filters.slice(0, 3)) assert.ok(filter.includes("privateSale=false"));
  assert.ok(!filters[3].includes("privateSale=false"));
});
test("creation requires admin and persists an unlisted offer with server validated price", async () => {
  let admin = false; const writes = [], redirects = [];
  const action = load("../app/admin/(dashboard)/produits/sur-mesure/actions.ts", {
    "@/lib/auth": { isAdmin: async () => admin },
    "@/lib/store": { createProduct: async data => { writes.push(data); return { ...data, id: "offer" }; } },
    "@/lib/private-sales": helpers,
    "next/cache": { revalidatePath() {} },
    "next/navigation": { redirect(path) { redirects.push(path); throw new Error("redirect"); } },
  }).createPrivateSaleAction;
  await assert.rejects(action({ error: "" }, form()), /redirect/);
  assert.equal(writes.length, 0); assert.equal(redirects[0], "/admin/login");
  admin = true;
  assert.match((await action({ error: "" }, form({ price: "-12" }))).error, /prix/);
  assert.equal(writes.length, 0);
  await assert.rejects(action({ error: "" }, form()), /redirect/);
  assert.equal(writes[0].priceCents, 4590); assert.equal(writes[0].privateSale, true);
  assert.equal(writes[0].featured, false); assert.equal(writes[0].partnerShared, false);
  assert.equal(redirects.at(-1), "/admin/produits/offer");
});
test("unlisted offer pages use noindex even when their catalog category is hidden", async () => {
  const product = { name: "Sur mesure", privateSale: true, active: true, category: "deco", slug: "secret", description: "Demande particulière", images: [] };
  const { generateMetadata } = load("../app/(site)/boutique/[slug]/page.tsx", {
    "next/link": () => null, "next/navigation": {},
    ...Object.fromEntries(["Gallery", "AddToCart", "ProductCard", "ReviewForm"].map(name => [`@/components/product/${name}`, () => null])),
    "@/components/custom-holder/CustomHolderProduct": () => null,
    "@/components/product/NosProductGallery": () => null, "@/lib/nos": { NOS_SLUG: "nos", NOS_COLORS: [] },
    "@/lib/store": { getProductBySlug: async () => product, getSettings: async () => ({}) },
    "@/lib/format": {}, "@/lib/free-shipping": {}, "@/lib/public-copy": { publicProductCopy: value => value },
    "@/lib/shipping": {}, "@/lib/categories": { getVisibleCategories: () => [] }, "@/lib/custom-holder": {},
  });
  assert.deepEqual((await generateMetadata({ params: Promise.resolve({ slug: "secret" }) })).robots, { index: false, follow: false });
  product.active = false;
  assert.equal((await generateMetadata({ params: Promise.resolve({ slug: "secret" }) })).title, "Objet introuvable");
});
