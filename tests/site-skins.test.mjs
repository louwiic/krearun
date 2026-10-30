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
const skins = load('../lib/site-skins.ts');
test('missing, disabled and unknown skins always preserve the default storefront', () => {
  for (const value of [{}, { site_skin: 'halloween', site_skin_enabled: false }, { site_skin: 'invalid', site_skin_enabled: true }, { site_skin: 'default', site_skin_enabled: true }]) assert.equal(skins.activeSiteSkin(value), 'default');
  assert.equal(skins.activeSiteSkin({ site_skin: 'halloween', site_skin_enabled: true }), 'halloween');
});
test('saving appearance requires admin and changes only the two appearance settings', async () => {
  let admin = false;
  const writes = [], invalidations = [];
  const action = load('../app/admin/(dashboard)/parametres/skin/actions.ts', { '@/lib/auth': { isAdmin: async () => admin }, '@/lib/site-skins': skins, '@/lib/store': { saveSettings: async patch => { writes.push(patch); return patch; } }, 'next/cache': { revalidatePath: (...args) => invalidations.push(args) } }).saveSiteSkinAction;
  const form = new FormData(); form.set('site_skin', 'halloween'); form.set('site_skin_enabled', 'on'); form.set('shipping_flat_cents', '1');
  assert.ok((await action({}, form)).error); assert.equal(writes.length, 0);
  admin = true; form.set('site_skin', 'unknown'); assert.ok((await action({}, form)).error); assert.equal(writes.length, 0);
  form.set('site_skin', 'halloween'); assert.deepEqual(await action({}, form), { saved: true });
  assert.deepEqual(writes[0], { site_skin: 'halloween', site_skin_enabled: true });
  form.delete('site_skin_enabled'); await action({}, form); assert.deepEqual(writes[1], { site_skin: 'halloween', site_skin_enabled: false });
  assert.ok(invalidations.some(([path, type]) => path === '/' && type === 'layout'));
});
test('a missing database field or failed write cannot report success', async () => {
  const action = load('../app/admin/(dashboard)/parametres/skin/actions.ts', { '@/lib/auth': { isAdmin: async () => true }, '@/lib/site-skins': skins, '@/lib/store': { saveSettings: async () => ({}) }, 'next/cache': { revalidatePath() { throw new Error('Should not invalidate'); } } }).saveSiteSkinAction;
  const form = new FormData(); form.set('site_skin', 'halloween'); form.set('site_skin_enabled', 'on'); assert.ok((await action({}, form)).error);
});
test('the public layout renders Halloween only when the saved skin is enabled', async () => {
  const { renderToStaticMarkup } = require('react-dom/server');
  const { createElement } = require('react');
  const Banner = load('../components/site/SeasonalSkinBanner.tsx').default;
  for (const enabled of [true, false]) {
    const mocks = Object.fromEntries(['@/components/analytics/ProductTracking', '@/components/site/PrivacyPreferences', '@/components/site/Navbar', '@/components/site/Footer', '@/components/cart/CartDrawer', '@/components/site/NewsletterPopup'].map(path => [path, () => null]));
    const Layout = load('../app/(site)/layout.tsx', { ...mocks, '@/components/product/ColorAvailabilityProvider': { ColorAvailabilityProvider: ({children}) => children }, '@/components/site/SeasonalSkinBanner': Banner, '@/components/site/HalloweenSpiders': load('../components/site/HalloweenSpiders.tsx').default, '@/lib/site-skins': skins, '@/lib/store': { getInventoryColors: async () => [], getSettings: async () => ({ announcement: '', site_skin: 'halloween', site_skin_enabled: enabled }) }, '@/lib/categories': { getVisibleCategories: () => [] } }).default;
    const html = renderToStaticMarkup(await Layout({ children: createElement('p', null, 'Catalogue conservé') }));
    assert.ok(html.includes('Catalogue conservé')); assert.ok(html.includes(`data-site-skin="${enabled ? 'halloween' : 'default'}"`));
    assert.equal(html.includes('Halloween à l’atelier'), enabled);
    assert.equal(html.includes('data-halloween-spiders'), enabled);
  }
});
