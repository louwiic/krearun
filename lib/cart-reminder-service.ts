import { MONSTER_MULTICOLOR_CENTS, parseMonsterColors } from "./monster-multicolor";
import { variantQuantityDiscounts } from "./noel-kits";
import { isPersonalizedLamp } from "./lamp-personalization";
import { createHash, randomBytes } from "node:crypto";
import { CART_REMINDER_CONSENT_VERSION, REMINDER_DELAY_MS, REMINDER_RETENTION_MS, REMINDER_TOKEN, canConfirmReminder, canSendReminder, reminderCart, reminderEmail, type CartReminder } from "./cart-reminders";
import { claimCartReminder, createCartReminder, dueCartReminders, findCartReminder, getProductById, getSettings, hasPaidOrderSince, pruneCartReminders, updateCartReminder } from "./store";
import { sendCartReminderEmail } from "./email";
import { siteOrigin } from "./seo";
import { getStripe, stripeConfigured } from "./stripe";
import { CLICKER_PRODUCT, CLICKER_PRODUCT_ID } from "./clicker";
import type { CartItem } from "./types";

const digest = (value: string) => createHash("sha256").update(value).digest("hex");
function urls(token: string) {
  const base = siteOrigin();
  return { confirm: `${base}/panier/rappel/${token}`, resume: `${base}/panier/reprendre/${token}`, unsubscribe: `${base}/panier/rappel/${token}?annuler=1`, oneClick: `${base}/api/cart-reminders/unsubscribe/${token}` };
}
export async function cartReminderForToken(token: string) {
  if (!REMINDER_TOKEN.test(token)) return null;
  const row = await findCartReminder("tokenHash", digest(token));
  return row && Date.parse(row.expiresAt) > Date.now() ? row : null;
}
export async function requestCartReminder(input: { email: unknown; consent: unknown; version: unknown; cart: unknown }) {
  if (!(await getSettings()).cart_email_reminder_enabled) throw new Error("Les rappels sont désactivés.");
  if (input.consent !== true || input.version !== CART_REMINDER_CONSENT_VERSION) throw new Error("Confirmez votre accord pour ce rappel panier.");
  const email = reminderEmail(input.email);
  const cart = reminderCart(input.cart);
  await pruneCartReminders();
  const existing = await findCartReminder("emailHash", digest(email));
  // Same response for existing/withdrawn addresses; never resubscribe or resend implicitly.
  if (existing) return { ok: true, token: "" };
  const token = randomBytes(32).toString("hex");
  const now = new Date().toISOString();
  const row = await createCartReminder({ email, emailHash: digest(email), tokenHash: digest(token), deliveryToken: token, cart,
    status: "unconfirmed", consentVersion: CART_REMINDER_CONSENT_VERSION, consentAt: now, confirmedAt: "", dueAt: "", expiresAt: new Date(Date.now() + REMINDER_RETENTION_MS).toISOString(), checkoutIds: [],
  });
  if (!await sendCartReminderEmail(email, "confirm", urls(token))) {
    await updateCartReminder(row.id, { status: "failed" });
    throw new Error("Le message de confirmation n’a pas pu être envoyé. Réessayez plus tard.");
  }
  return { ok: true, token };
}
export async function confirmCartReminder(token: string) {
  const row = await cartReminderForToken(token);
  if (!row || !canConfirmReminder(row)) return false;
  await updateCartReminder(row.id, { status: "pending", confirmedAt: new Date().toISOString(), dueAt: new Date(Date.now() + REMINDER_DELAY_MS).toISOString() });
  return true;
}
export async function cancelCartReminder(token: string) {
  const row = await cartReminderForToken(token);
  if (row && row.status !== "purchased") await updateCartReminder(row.id, { status: "cancelled", cart: [], deliveryToken: "" });
}
export async function attachReminderCheckout(email: string, checkoutId: string) {
  const row = await findCartReminder("emailHash", digest(email.trim().toLowerCase()));
  if (row && ["pending", "unconfirmed"].includes(row.status)) {
    await updateCartReminder(row.id, { checkoutIds: [...new Set([...(row.checkoutIds || []), checkoutId])].slice(-20) });
  }
}
export async function stopCartReminderAfterPurchase(email: string) {
  const row = await findCartReminder("emailHash", digest(email.trim().toLowerCase()));
  if (row && ["pending", "unconfirmed", "sent"].includes(row.status)) await updateCartReminder(row.id, { status: "purchased", cart: [], deliveryToken: "" });
}
async function purchased(row: CartReminder) {
  if (await hasPaidOrderSince(row.email, row.consentAt)) return true;
  if (row.checkoutIds?.length) {
    if (!stripeConfigured()) throw new Error("Payment verification unavailable");
    for (const id of row.checkoutIds) {
      const session = await getStripe().checkout.sessions.retrieve(id);
      if (session.payment_status === "paid" || session.payment_status === "no_payment_required") return true;
    }
  }
  return false;
}
export async function processCartReminders() {
  await pruneCartReminders();
  let sent = 0;
  if (!(await getSettings()).cart_email_reminder_enabled) return { sent };
  for (const candidate of await dueCartReminders()) {
    if (!canSendReminder(candidate)) continue;
    // Fail closed if payment checks fail. Leave pending for a later worker run.
    if (await purchased(candidate)) { await updateCartReminder(candidate.id, { status: "purchased", cart: [], deliveryToken: "" }); continue; }
    if (!await claimCartReminder(candidate)) continue;
    const fresh = await cartReminderForToken(candidate.deliveryToken);
    if (!fresh || !canSendReminder(fresh)) continue;
    if (await purchased(fresh)) { await updateCartReminder(fresh.id, { status: "purchased", cart: [], deliveryToken: "" }); continue; }
    const accepted = await sendCartReminderEmail(fresh.email, "remind", urls(fresh.deliveryToken));
    await updateCartReminder(fresh.id, { status: accepted ? "sent" : "failed" });
    if (accepted) sent++;
  }
  return { sent };
}
export async function restoreReminderCart(token: string): Promise<CartItem[]> {
  const row = await cartReminderForToken(token);
  if (!row || !["pending", "sent"].includes(row.status)) return [];
  if (await purchased(row)) { await updateCartReminder(row.id, { status: "purchased", cart: [], deliveryToken: "" }); return []; }
  const result: CartItem[] = [];
  for (const saved of row.cart) {
    const product = saved.productId === CLICKER_PRODUCT_ID ? CLICKER_PRODUCT : await getProductById(saved.productId);
    if (!product?.active || product.privateSale) continue;
    const activeVariants = product.variants.filter(v => v.active);
    const variant = activeVariants.find(v => v.id === saved.variantId);
    if (activeVariants.length && !variant) continue;
    const stock = product.slug === "lettre-de-naissance-personnalisee" ? 20 : variant?.stock ?? product.stock;
    if (!product.preorder && stock <= 0) continue;
    const personalizationPriceCents = (product.namePersonalizationEnabled && saved.customName && !isPersonalizedLamp(product.slug) ? product.namePersonalizationPriceCents : 0) + (product.slug === "porte-canette-monster" && parseMonsterColors(saved.color) ? MONSTER_MULTICOLOR_CENTS : 0);
    result.push({ ...saved, slug: product.slug, name: product.name, priceCents: (variant?.priceCents || product.priceCents) + personalizationPriceCents,
      image: variant?.image || product.images[0] || "/products/hero.svg", stock, weightGrams: variant?.weightGrams || product.weightGrams,
      preorder: product.preorder, quantity: Math.min(saved.quantity, product.preorder ? 20 : stock),
      personalizationPriceCents,
      quantityDiscounts: variantQuantityDiscounts(product, variant?.id),
    });
  }
  return result;
}
