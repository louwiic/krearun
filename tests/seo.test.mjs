import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(path, mocks = {}) {
  const { outputText } = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } });
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', outputText)(name => mocks[name] ?? require(name), mod, mod.exports);
  return mod.exports;
}
const seo = load('../lib/seo.ts');
const product = { id: 'public', slug: 'example', name: 'Objet', description: 'Une création.', tagline: 'Exemple', category: 'deco', active: true, priceCents: 2290, stock: 99, images: ['/example.webp'], variants: [{ active: true, stock: 0, priceCents: 1890 }, { active: false, stock: 100, priceCents: 1 }] };
test('canonical origin strips www and container port from production configuration', () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL;
  try { for (const value of ['http://www.krearun.re:3000', 'http://krearun.re:3000', 'https://krearun.re/']) { process.env.NEXT_PUBLIC_SITE_URL = value; assert.equal(seo.siteOrigin(), 'https://krearun.re'); } }
  finally { if (original === undefined) delete process.env.NEXT_PUBLIC_SITE_URL; else process.env.NEXT_PUBLIC_SITE_URL = original; }
});
test('JSON-LD matches active variant pricing and stock, and includes only approved product reviews', () => {
  const review = { productId: 'public', approved: true, rating: 5, authorName: 'Camille', message: 'Merci', email: 'private@example.invalid' };
  const data = seo.productStructuredData(product, 'Décoration', [review, { ...review, approved: false, rating: 1 }, { ...review, productId: 'other', rating: 1 }]);
  assert.equal(data.offers.price, '18.90'); assert.match(data.offers.availability, /OutOfStock$/);
  assert.equal(data.aggregateRating.ratingValue, 5); assert.equal(data.aggregateRating.reviewCount, 1);
  assert.equal(data.review.length, 1); assert.ok(!JSON.stringify(data).includes(review.email));
  assert.equal(seo.productStructuredData(product, 'Décoration', []).aggregateRating, undefined);
});
test('JSON-LD cannot close its script element with product or review text', () => {
  const value = { name: '</script><script>alert(1)</script>' };
  const json = seo.jsonLdString(value); assert.ok(!json.includes('<')); assert.deepEqual(JSON.parse(json), value);
});
test('categories have distinct metadata and canonical URLs; unknown filters resolve to the catalog', async () => {
  const { generateMetadata } = load('../app/(site)/boutique/page.tsx', { 'next/link': () => null, '@/components/product/ProductCard': () => null, '@/lib/seo': seo, '@/lib/store': { getSettings: async () => ({}) }, '@/lib/categories': { getVisibleCategories: () => [{ value: 'porte-boisson', label: 'Porte-boisson' }, { value: 'lunette', label: 'Lunette' }] } });
  const holder = await generateMetadata({ searchParams: Promise.resolve({ categorie: 'porte-boisson' }) });
  const glasses = await generateMetadata({ searchParams: Promise.resolve({ categorie: 'lunette' }) });
  assert.notEqual(holder.title, glasses.title); assert.notEqual(holder.description, glasses.description);
  assert.equal(holder.alternates.canonical, '/boutique?categorie=porte-boisson');
  assert.equal((await generateMetadata({ searchParams: Promise.resolve({ categorie: 'hidden' }) })).alternates.canonical, '/boutique');
});
test('sitemap includes customizers and reviews, excludes private, inactive, hidden and utility pages', async () => {
  const sitemap = load('../app/sitemap.ts', { '@/lib/seo': seo, '@/lib/store': { getSettings: async () => ({}), getProducts: async () => [product, { ...product, slug: 'private', privateSale: true }, { ...product, slug: 'inactive', active: false }, { ...product, slug: 'hidden', category: 'hidden' }] }, '@/lib/categories': { getVisibleCategories: () => [{ value: 'deco' }] } }).default;
  const urls = (await sitemap()).map(entry => new URL(entry.url));
  for (const path of ['/clicker-studio', '/lettre-personnalisee', '/avis', '/boutique/example']) assert.ok(urls.some(url => url.pathname === path));
  for (const path of ['/boutique/private', '/boutique/inactive', '/boutique/hidden', '/suivi', '/compte', '/panier']) assert.ok(!urls.some(url => url.pathname === path));
});
test('new arrivals have a canonical URL and exclude products that are not new', async () => {
  const { renderToStaticMarkup } = require('react-dom/server');
  const { createElement } = require('react');
  const Page = load('../app/(site)/boutique/page.tsx', { 'next/link': ({children,...props}) => createElement('a',props,children), '@/components/product/ProductCard': ({product}) => createElement('span',null,product.name), '@/lib/seo': seo, '@/lib/store': { getSettings: async () => ({}), getProducts: async () => [{id:'new', name:'New creation', category:'deco', isNew:true}, {id:'old', name:'Older creation', category:'deco', isNew:false}] }, '@/lib/categories': { getVisibleCategories: () => [{value:'deco',label:'Décoration'}] } });
  const props = { searchParams: Promise.resolve({nouveautes:'1'}) };
  assert.equal((await Page.generateMetadata(props)).alternates.canonical, '/boutique?nouveautes=1');
  const html=renderToStaticMarkup(await Page.default(props));assert.ok(html.includes('New creation'));assert.ok(!html.includes('Older creation'));
});
