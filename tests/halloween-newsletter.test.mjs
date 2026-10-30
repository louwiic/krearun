import test from "node:test";
import assert from "node:assert/strict";
import { HALLOWEEN_OFFER as offer, halloweenNewsletterHtml } from "../lib/halloween-newsletter.ts";

test("Halloween email and offer agree on amounts, code, period and working public links", () => {
  assert.equal(offer.amountCents, 500);
  assert.equal(offer.minimumAmountCents, 4000);
  assert.equal(new Date(offer.expiresAt * 1000).toISOString(), "2026-11-01T19:59:59.000Z");
  const html = halloweenNewsletterHtml();
  assert.match(html, /HALLOWEEN5/);
  assert.match(html, /dès 40 € d’achat/);
  assert.match(html, /après remises automatiques et hors frais de port/);
  assert.match(html, /https:\/\/krearun.re\/boutique/);
  assert.doesNotMatch(html, /(?:src|href)="\//);
  assert.doesNotMatch(html, /Kleeky|AVANTNOEL|99€/i);
});
