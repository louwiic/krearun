import type Stripe from "stripe";

export function promotionDetails(code: Stripe.PromotionCode, now = Date.now()) {
  const raw = code.promotion.coupon;
  const coupon = raw && typeof raw !== "string" ? raw : null;
  const deadlines = [code.expires_at, coupon?.redeem_by].filter(
    (value): value is number => typeof value === "number",
  );
  const expiresAt = deadlines.length ? Math.min(...deadlines) : null;
  const expired = expiresAt !== null && expiresAt * 1000 <= now;
  const exhausted = Boolean(
    (code.max_redemptions && code.times_redeemed >= code.max_redemptions) ||
    (coupon?.max_redemptions && coupon.times_redeemed >= coupon.max_redemptions),
  );
  const money = (amount: number, currency: string) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(amount / 100);
  const discount = coupon?.percent_off != null
    ? `${coupon.percent_off} %`
    : coupon?.amount_off != null
      ? money(coupon.amount_off, coupon.currency || "eur")
      : "Réduction Stripe";
  const conditions = [
    expiresAt
      ? `Valable jusqu’au ${new Intl.DateTimeFormat("fr-FR", {
          dateStyle: "long", timeStyle: "medium", timeZone: "Indian/Reunion",
        }).format(new Date(expiresAt * 1000))} (heure de La Réunion).`
      : "Sans date d’expiration.",
    code.restrictions.minimum_amount
      ? `Panier minimum : ${money(code.restrictions.minimum_amount, code.restrictions.minimum_amount_currency || "eur")}.`
      : "Aucun montant minimum de panier.",
    code.restrictions.first_time_transaction
      ? "Réservé à votre première commande."
      : "Valable également si vous avez déjà commandé.",
    code.max_redemptions
      ? `Limité à ${code.max_redemptions} utilisation(s) au total, dont ${Math.max(0, code.max_redemptions - code.times_redeemed)} restante(s) au moment de cet envoi.`
      : "Nombre d’utilisations du code non limité.",
    "Saisissez ce code dans le panier avant de régler votre commande.",
  ];
  if (coupon?.applies_to?.products.length) conditions.push("Valable uniquement sur les produits éligibles à cette réduction.");
  if (code.customer) conditions.push("Code réservé au compte client auquel il est associé.");
  return {
    discount, conditions, expiresAt, expired, exhausted,
    usable: Boolean(code.active && coupon?.valid && !expired && !exhausted),
  };
}
