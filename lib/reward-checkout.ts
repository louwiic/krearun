import type Stripe from "stripe";
import type { Reward } from "./rewards";

/** Created only when a real checkout is requested, never while browsing. */
export async function checkoutRewardCoupon(stripe: Stripe, reward: Reward): Promise<string> {
  const id = `krearun-reward-v1-${reward.amountCents}`;
  try {
    const coupon = await stripe.coupons.retrieve(id);
    if (coupon.valid && coupon.amount_off === reward.amountCents && coupon.currency === "eur" && coupon.duration === "once") return coupon.id;
    throw new Error("Récompense temporairement indisponible.");
  } catch (error) {
    if ((error as { code?: string }).code !== "resource_missing") throw error;
  }
  const coupon = await stripe.coupons.create({ id, amount_off: reward.amountCents, currency: "eur", duration: "once", name: `Récompense Kréarun ${reward.amountCents / 100} €` }, { idempotencyKey: id });
  return coupon.id;
}
