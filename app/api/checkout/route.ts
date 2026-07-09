import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getProductById, getSettings } from "@/lib/store";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { calculateShippingCents, parseShippingRates } from "@/lib/shipping";
import type { CheckoutCustomer } from "@/lib/types";

interface CheckoutItem {
  productId: string;
  quantity: number;
  color: string;
  customName?: string;
}

interface CheckoutBody {
  items: CheckoutItem[];
  customer?: Partial<CheckoutCustomer>;
  promoCode?: string;
}

function normalizeCustomName(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, 24);
}

function text(value: unknown, max = 120): string {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max);
}

function validateCustomer(input: Partial<CheckoutCustomer> | undefined): CheckoutCustomer {
  const customer: CheckoutCustomer = {
    email: text(input?.email, 160).toLowerCase(),
    firstName: text(input?.firstName, 80),
    lastName: text(input?.lastName, 80),
    phone: text(input?.phone, 40),
    addressLine1: text(input?.addressLine1, 160),
    addressLine2: text(input?.addressLine2, 160),
    postalCode: text(input?.postalCode, 20),
    city: text(input?.city, 100),
    country: text(input?.country || "RE", 2).toUpperCase(),
  };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.email)) {
    throw new Error("Indiquez une adresse e-mail valide.");
  }
  if (!customer.firstName || !customer.lastName) {
    throw new Error("Indiquez votre prénom et votre nom.");
  }
  if (!customer.phone) throw new Error("Indiquez votre téléphone.");
  if (!customer.addressLine1 || !customer.postalCode || !customer.city) {
    throw new Error("Complétez votre adresse de livraison.");
  }
  return customer;
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
  let customer: CheckoutCustomer;
  let promoCode = "";
  try {
    const body = (await req.json()) as CheckoutBody;
    items = body.items;
    if (!Array.isArray(items) || items.length === 0) throw new Error();
    customer = validateCustomer(body.customer);
    promoCode = text(body.promoCode, 80);
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error && e.message
            ? e.message
            : "Panier ou coordonnées client invalides.",
      },
      { status: 400 }
    );
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
  const metadataItems: { p: string; q: number; c: string; n?: string }[] = [];
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
    const customName = product.namePersonalizationEnabled
      ? normalizeCustomName(item.customName)
      : "";
    if (product.namePersonalizationEnabled && !customName) {
      return NextResponse.json(
        { error: `Indiquez le prénom pour « ${product.name} ».` },
        { status: 400 }
      );
    }
    const optionParts = [
      item.color,
      customName ? `Prénom : ${customName}` : "",
    ].filter(Boolean);
    subtotalCents += product.priceCents * quantity;
    totalWeightGrams += (product.weightGrams || 0) * quantity;
    lineItems.push({
      price_data: {
        currency: "eur",
        unit_amount: product.priceCents,
        product_data: {
          name: optionParts.length
            ? `${product.name} — ${optionParts.join(" · ")}`
            : product.name,
          description: product.preorder ? "Pré-commande · bientôt disponible" : undefined,
          images: product.images[0]?.startsWith("http")
            ? [product.images[0]]
            : undefined,
        },
      },
      quantity,
    });
    metadataItems.push({
      p: product.id,
      q: quantity,
      c: item.color || "",
      ...(customName ? { n: customName } : {}),
    });
  }

  const shippingRates = parseShippingRates(settings.shipping_rates_json);
  const shipping = calculateShippingCents(totalWeightGrams || 1, shippingRates);
  const freeShipping =
    settings.free_shipping_threshold_cents > 0 &&
    subtotalCents >= settings.free_shipping_threshold_cents;
  const shippingCents = freeShipping ? 0 : shipping.priceCents;

  const stripe = getStripe();
  const discounts: NonNullable<Stripe.Checkout.SessionCreateParams["discounts"]> = [];

  try {
    if (promoCode) {
      const promotionCodes = await stripe.promotionCodes.list({
        code: promoCode,
        active: true,
        limit: 1,
      });
      const promotionCode = promotionCodes.data[0];
      if (!promotionCode) {
        return NextResponse.json(
          { error: "Ce code promo n'est pas valide." },
          { status: 400 }
        );
      }
      discounts.push({ promotion_code: promotionCode.id });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: customer.email,
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
      phone_number_collection: { enabled: false },
      billing_address_collection: "auto",
      locale: "fr",
      metadata: {
        items: JSON.stringify(metadataItems),
        customerEmail: customer.email,
        customerFirstName: customer.firstName,
        customerLastName: customer.lastName,
        customerPhone: customer.phone,
        addressLine1: customer.addressLine1,
        addressLine2: customer.addressLine2,
        postalCode: customer.postalCode,
        city: customer.city,
        country: customer.country,
        promoCode,
      },
      discounts: discounts.length ? discounts : undefined,
      success_url: `${siteUrl}/commande/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/commande/annulee`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("Stripe checkout :", e);
    return NextResponse.json(
      { error: "Impossible de préparer le paiement. Vérifiez la configuration Stripe." },
      { status: 502 }
    );
  }
}
