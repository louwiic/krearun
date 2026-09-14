import type Stripe from "stripe";
import { CUSTOM_LETTER_PRICE_CENTS, type LetterConfiguration } from "./custom-letter-settings";

export function letterCheckoutParams(configuration: LetterConfiguration, shippingCents: number, siteUrl: string): Stripe.Checkout.SessionCreateParams {
  return {
    mode: "payment", payment_method_types: ["card"], locale: "fr",
    line_items: [{ quantity: 1, price_data: { currency: "eur", unit_amount: CUSTOM_LETTER_PRICE_CENTS,
      product_data: { name: `Lettre ${configuration.initial} personnalisée · ${configuration.name}`, description: `${configuration.height} mm · prénom à emboîter` },
    } }],
    shipping_address_collection: { allowed_countries: ["RE"] },
    phone_number_collection: { enabled: true },
    shipping_options: [{ shipping_rate_data: { type: "fixed_amount", fixed_amount: { amount: shippingCents, currency: "eur" }, display_name: shippingCents ? "Livraison à La Réunion" : "Livraison offerte" } }],
    metadata: { customLetter: JSON.stringify(configuration), items: "[]" },
    success_url: `${siteUrl}/commande/succes?session_id={CHECKOUT_SESSION_ID}&letter=1`,
    cancel_url: `${siteUrl}/lettre-personnalisee`,
  };
}
