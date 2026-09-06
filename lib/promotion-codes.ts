import "server-only";

import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

export interface CreatePromotionCodeInput {
  code: string;
  discountType: "percent" | "amount";
  value: number;
  expiresAt?: number;
  maxRedemptions?: number;
  minimumAmountCents?: number;
  firstTimeOnly: boolean;
}

export async function getPromotionCodes() {
  const stripe = getStripe();
  const result = await stripe.promotionCodes.list({
    limit: 100,
    expand: ["data.promotion.coupon"],
  });

  return result.data;
}

export async function createPromotionCode(input: CreatePromotionCodeInput) {
  const stripe = getStripe();
  const couponParams: Stripe.CouponCreateParams = {
    duration: "once",
    name: `Code ${input.code}`,
    ...(input.discountType === "percent"
      ? { percent_off: input.value }
      : { amount_off: Math.round(input.value * 100), currency: "eur" }),
  };

  const coupon = await stripe.coupons.create(couponParams);

  try {
    return await stripe.promotionCodes.create({
      code: input.code,
      promotion: { type: "coupon", coupon: coupon.id },
      active: true,
      ...(input.expiresAt ? { expires_at: input.expiresAt } : {}),
      ...(input.maxRedemptions ? { max_redemptions: input.maxRedemptions } : {}),
      ...(input.minimumAmountCents || input.firstTimeOnly
        ? {
            restrictions: {
              ...(input.minimumAmountCents
                ? {
                    minimum_amount: input.minimumAmountCents,
                    minimum_amount_currency: "eur",
                  }
                : {}),
              first_time_transaction: input.firstTimeOnly,
            },
          }
        : {}),
    });
  } catch (error) {
    await stripe.coupons.del(coupon.id).catch(() => undefined);
    throw error;
  }
}

export async function setPromotionCodeActive(id: string, active: boolean) {
  return getStripe().promotionCodes.update(id, { active });
}

export function promotionCoupon(code: Stripe.PromotionCode) {
  const coupon = code.promotion.coupon;
  return coupon && typeof coupon !== "string" ? coupon : null;
}
