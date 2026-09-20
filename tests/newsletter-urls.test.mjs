import test from "node:test";
import assert from "node:assert/strict";
import { newsletterPublicUrl, normalizeNewsletterUrls } from "../lib/newsletter-urls.ts";

test("uploaded R2 image receives the public HTTPS origin", () => {
  assert.equal(newsletterPublicUrl("/api/r2/site/newsletter/photo.webp"), "https://krearun.re/api/r2/site/newsletter/photo.webp");
});
test("existing composed HTML gets absolute images and links when sent", () => {
  const html = `<p><img src="/api/r2/site/newsletter/photo.webp" alt="Produit" /></p><a href='/boutique'>Voir</a>`;
  assert.equal(normalizeNewsletterUrls(html), `<p><img src="https://krearun.re/api/r2/site/newsletter/photo.webp" alt="Produit" /></p><a href='https://krearun.re/boutique'>Voir</a>`);
});
test("external URLs, embedded images, unsubscribe email and anchors stay unchanged", () => {
  const html = `<img src="https://cdn.example.com/a.jpg"><img src="cid:photo"><img src="data:image/png;base64,abc"><a href="mailto:stdcreativ974@gmail.com">Contact</a><a href="#details">Détails</a>`;
  assert.equal(normalizeNewsletterUrls(html), html);
});
test("unquoted and protocol-relative image URLs are supported; normalization is idempotent", () => {
  const html = normalizeNewsletterUrls('<IMG SRC=/api/r2/a.webp><img src="//cdn.example.com/b.jpg">');
  assert.equal(html, '<IMG SRC="https://krearun.re/api/r2/a.webp"><img src="https://cdn.example.com/b.jpg">');
  assert.equal(normalizeNewsletterUrls(html), html);
});
