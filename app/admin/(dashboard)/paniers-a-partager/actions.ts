"use server";

import { createHash } from "node:crypto";
import { isAdmin } from "@/lib/auth";
import { packCheckoutItems } from "@/lib/checkout-item-metadata";
import { LEGAL_VERSION } from "@/lib/legal";
import { siteOrigin } from "@/lib/seo";
import { quoteSharedCart } from "@/lib/shared-cart";
import { getProducts } from "@/lib/store";
import { getStripe } from "@/lib/stripe";

export type SharedCartResult = { url?: string; expiresAt?: number; totalCents?: number; error?: string };

export async function createSharedCart(_previous: SharedCartResult, form: FormData): Promise<SharedCartResult> {
  if (!(await isAdmin())) return { error: "Reconnectez-vous à l’administration." };
  const requestId = String(form.get("requestId") ?? "");
  const country = String(form.get("country") ?? "");
  const email = String(form.get("email") ?? "").trim();
  const raw = String(form.get("rows") ?? "");
  if (!/^[a-f0-9-]{36}$/.test(requestId) || !["RE", "FR"].includes(country) || raw.length > 10_000) return { error: "Panier invalide." };
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return { error: "Vérifiez l’adresse e-mail du client." };

  let quote;
  let metadata;
  try {
    const products = await getProducts({ includeInactive: true });
    quote = quoteSharedCart(JSON.parse(raw), products, String(form.get("shipping") ?? ""));
    metadata = packCheckoutItems(quote.lines);
  } catch (cause) {
    return { error: cause instanceof SyntaxError ? "Panier invalide." : cause instanceof Error && !cause.message.startsWith("PocketBase") ? cause.message : "Impossible de vérifier le catalogue." };
  }

  const origin = siteOrigin();
  const fingerprint = createHash("sha256").update(JSON.stringify({ requestId, country, email, quote })).digest("hex");
  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment", locale: "fr", payment_method_types: ["card"],
      ...(email ? { customer_email: email } : {}),
      line_items: quote.lines.map(line => ({
        price_data: { currency: "eur", unit_amount: line.u, product_data: {
          name: line.label, description: [line.variant, line.c, line.n].filter(Boolean).join(" · ") || undefined,
        } },
        quantity: line.q,
      })),
      shipping_address_collection: { allowed_countries: [country as "RE" | "FR"] },
      phone_number_collection: { enabled: true },
      shipping_options: [{ shipping_rate_data: {
        type: "fixed_amount", fixed_amount: { amount: quote.shippingCents, currency: "eur" },
        display_name: quote.shippingCents ? "Livraison du panier" : "Livraison offerte",
      } }],
      custom_text: { submit: { message: `En réglant cette commande, vous acceptez les [conditions générales de vente](${origin}/cgv).` } },
      metadata: { ...metadata, sharedCart: "1", termsVersion: LEGAL_VERSION },
      success_url: `${origin}/commande/succes?session_id={CHECKOUT_SESSION_ID}&partage=1`,
      cancel_url: `${origin}/boutique`,
    }, { idempotencyKey: `shared-cart-${fingerprint}` });
    if (!session.url || session.status !== "open" || session.expires_at * 1000 <= Date.now()) return { error: "Ce lien est expiré. Rechargez la page pour en créer un nouveau." };
    return { url: session.url, expiresAt: session.expires_at, totalCents: quote.subtotalCents + quote.shippingCents };
  } catch (cause) {
    console.error("Création du panier partagé Stripe", cause instanceof Error ? cause.name : "unknown");
    return { error: "Stripe n’a pas pu créer le lien de paiement. Réessayez dans un instant." };
  }
}
