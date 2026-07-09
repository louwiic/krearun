import { NextResponse } from "next/server";
import { getProductById, getSettings } from "@/lib/store";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { calculateShippingCents, parseShippingRates } from "@/lib/shipping";

interface CheckoutItem {
  productId: string;
  quantity: number;
  color: string;
}

export async function POST(req: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Le paiement n'est pas encore activé sur cette boutique (clés Stripe manquantes dans .env).",
      },
      { status: 503 }
    );
  }

  let items: CheckoutItem[];
  try {
    const body = await req.json();
    items = body.items;
    if (!Array.isArray(items) || items.length === 0) throw new Error();
  } catch {
    return NextResponse.json({ error: "Panier invalide." }, { status: 400 });
  }

  const settings = await getSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Prix relus côté serveur — on ne fait jamais confiance au client
  const lineItems: {
    price_data: {
      currency: string;
      unit_amount: number;
      product_data: { name: string; description?: string; images?: string[] };
    };
    quantity: number;
  }[] = [];
  const metadataItems: { p: string; q: number; c: string }[] = [];
  let subtotalCents = 0;
  let totalWeightGrams = 0;

  for (const item of items) {
    const product = await getProductById(item.productId);
    if (!product || !product.active) {
      return NextResponse.json(
        { error: "Un article du panier n'est plus disponible." },
        { status: 400 }
      );
    }
    const maxQuantity = product.preorder ? 20 : product.stock;
    const quantity = Math.max(1, Math.min(Number(item.quantity) || 1, maxQuantity));
    if (product.stock <= 0 && !product.preorder) {
      return NextResponse.json(
        { error: `« ${product.name} » est épuisé pour le moment.` },
        { status: 400 }
      );
    }
    subtotalCents += product.priceCents * quantity;
    totalWeightGrams += (product.weightGrams || 0) * quantity;
    lineItems.push({
      price_data: {
        currency: "eur",
        unit_amount: product.priceCents,
        product_data: {
          name: item.color ? `${product.name} — ${item.color}` : product.name,
          description: product.preorder ? "Pré-commande · bientôt disponible" : undefined,
          images: product.images[0]?.startsWith("http")
            ? [product.images[0]]
            : undefined,
        },
      },
      quantity,
    });
    metadataItems.push({ p: product.id, q: quantity, c: item.color || "" });
  }

  const shippingRates = parseShippingRates(settings.shipping_rates_json);
  const shipping = calculateShippingCents(totalWeightGrams || 1, shippingRates);
  const freeShipping =
    settings.free_shipping_threshold_cents > 0 &&
    subtotalCents >= settings.free_shipping_threshold_cents;
  const shippingCents = freeShipping ? 0 : shipping.priceCents;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    shipping_address_collection: {
      allowed_countries: ["FR", "BE", "LU", "CH", "MC"],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: shippingCents, currency: "eur" },
          display_name: freeShipping
            ? "Livraison suivie offerte"
            : `Colissimo Réunion · ${shipping.label}`,
          delivery_estimate: {
            minimum: { unit: "business_day", value: 4 },
            maximum: { unit: "business_day", value: 8 },
          },
        },
      },
    ],
    phone_number_collection: { enabled: true },
    locale: "fr",
    metadata: { items: JSON.stringify(metadataItems) },
    success_url: `${siteUrl}/commande/succes?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/commande/annulee`,
  });

  return NextResponse.json({ url: session.url });
}
