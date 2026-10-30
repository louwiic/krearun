import env from "@next/env";
import Stripe from "stripe";
import { HALLOWEEN_OFFER as offer, halloweenNewsletterHtml } from "../lib/halloween-newsletter.ts";
import { mkdir, writeFile } from "node:fs/promises";

env.loadEnvConfig(process.cwd());
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const directory = new URL("../outputs/halloween-newsletter-2026-10-30/", import.meta.url);
await mkdir(directory, { recursive: true });
await writeFile(new URL("newsletter.html", directory), halloweenNewsletterHtml());
await writeFile(new URL("objet-et-conditions.txt", directory), `${offer.subject}\n\nCode : ${offer.code}\n5 € de réduction dès 40 € d’articles, hors frais de port, après remises automatiques.\nDu 30 octobre au 1er novembre 2026 à 23 h 59 (La Réunion).\nUn seul code par commande. Clients nouveaux et existants.\nNewsletter préparée, aucun e-mail envoyé.\n`);

const codes = await stripe.promotionCodes.list({ code: offer.code, limit: 100, expand: ["data.promotion.coupon"] });
let code = codes.data.find(code => code.active);
if (code) {
  const coupon = code.promotion.coupon;
  if (!coupon || typeof coupon === "string" || !coupon.valid || coupon.amount_off !== offer.amountCents || coupon.currency !== "eur" ||
    code.restrictions.minimum_amount !== offer.minimumAmountCents || code.restrictions.minimum_amount_currency !== "eur" ||
    code.restrictions.first_time_transaction || code.expires_at !== offer.expiresAt || code.customer || code.max_redemptions || coupon.applies_to?.products.length) {
    throw new Error("HALLOWEEN5 existe avec des conditions différentes : aucune modification effectuée.");
  }
} else if (process.argv.includes("--apply")) {
  if (Date.now() / 1000 >= offer.expiresAt) throw new Error("La campagne est terminée, création refusée.");
  const coupon = await stripe.coupons.create({
    duration: "once", name: "Halloween Kréarun 2026 — 5 € dès 40 €", amount_off: offer.amountCents, currency: "eur",
    metadata: { campaign: "halloween-2026" },
  }, { idempotencyKey: "krearun-halloween-2026-coupon-v1" });
  code = await stripe.promotionCodes.create({
    code: offer.code, promotion: { type: "coupon", coupon: coupon.id }, active: true,
    expires_at: offer.expiresAt,
    restrictions: { minimum_amount: offer.minimumAmountCents, minimum_amount_currency: "eur", first_time_transaction: false },
    metadata: { campaign: "halloween-2026" },
  }, { idempotencyKey: "krearun-halloween-2026-promotion-v1" });
}
console.log(JSON.stringify({ code: offer.code, active: code?.active || false, liveMode: code?.livemode ?? null, amountCents: offer.amountCents, minimumAmountCents: offer.minimumAmountCents, expiresAt: new Date(offer.expiresAt * 1000).toISOString(), emailSent: false, applyRequired: !code }));
