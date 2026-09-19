import test from "node:test";
import assert from "node:assert/strict";
import { promotionDetails } from "../lib/promotion-details.ts";

const deadline = Date.parse("2027-06-19T19:59:59Z") / 1000;
function promo(overrides = {}) {
  return {
    active: true, expires_at: deadline, max_redemptions: 1, times_redeemed: 0,
    restrictions: { minimum_amount: 2500, minimum_amount_currency: "eur", first_time_transaction: true },
    promotion: { coupon: { valid: true, percent_off: 10, redeem_by: null, max_redemptions: null } },
    ...overrides,
  };
}

test("email conditions preserve exact Reunion expiration and redemption restrictions", () => {
  const details = promotionDetails(promo(), 0);
  assert.equal(details.usable, true);
  assert.equal(details.discount, "10 %");
  const content = details.conditions.join(" ");
  assert.match(content, /19 juin 2027/);
  assert.match(content, /23:59:59/);
  assert.match(content, /25,00/);
  assert.match(content, /première commande/);
  assert.match(content, /1 utilisation/);
});

test("inactive, expired, exhausted and invalid coupons cannot be emailed", () => {
  for (const code of [promo({ active: false }), promo({ times_redeemed: 1 }),
    promo({ promotion: { coupon: { valid: false } } }),
    promo({ promotion: { coupon: "coupon_unexpanded" } })]) {
    assert.equal(promotionDetails(code, 0).usable, false);
  }
  assert.equal(promotionDetails(promo(), deadline * 1000).usable, false);
  const code = promo({ promotion: { coupon: { valid: true, redeem_by: deadline - 10 } } });
  assert.equal(promotionDetails(code, (deadline - 5) * 1000).usable, false);
});

test("unlimited fixed discounts keep their currency and lack of expiry", () => {
  const details = promotionDetails(promo({ expires_at: null, max_redemptions: null,
    restrictions: {}, promotion: { coupon: { valid: true, amount_off: 500, currency: "eur" } },
  }), 0);
  assert.match(details.discount, /5,00/);
  assert.equal(details.expiresAt, null);
  assert.match(details.conditions.join(" "), /Sans date d’expiration/);
  assert.match(details.conditions.join(" "), /non limité/);
});
