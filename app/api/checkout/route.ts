import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getProductById, getSettings } from "@/lib/store";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { publicColorName } from "@/lib/colors";
import { billableProductWeight, hasMissingProductWeight } from "@/lib/free-shipping";
import { calculateShippingCents, parseShippingRates } from "@/lib/shipping";
import { getPickupPoint } from "@/lib/pickup";
import type { CheckoutCustomer, FulfillmentMethod } from "@/lib/types";
import { discountedUnitPriceCents } from "@/lib/quantity-discounts";

interface CheckoutItem {
  productId: string;
  variantId?: string;
  quantity: number;
  color: string;
  customName?: string;
  keychainChoice?: string;
}

interface CheckoutBody {
  items: CheckoutItem[];
  customer?: Partial<CheckoutCustomer>;
  promoCode?: string;
  note?: string;
  fulfillmentMethod?: FulfillmentMethod;
  pickupPointId?: string;
}

function normalizeCustomName(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, 24);
}

function text(value: unknown, max = 120): string {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max);
}

function validateCustomer(
  input: Partial<CheckoutCustomer> | undefined,
  fulfillmentMethod: FulfillmentMethod
): CheckoutCustomer {
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
  if (
    fulfillmentMethod === "delivery" &&
    (!customer.addressLine1 || !customer.postalCode || !customer.city)
  ) {
    throw new Error("Complétez votre adresse de livraison.");
  }
  return customer;
}

export async function POST(req: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Le paiement n'est pas encore activé sur cette boutique.",
      },
      { status: 503 }
    );
  }

  let items: CheckoutItem[];
  let customer: CheckoutCustomer;
  let promoCode = "";
  let orderNote = "";
  let fulfillmentMethod: FulfillmentMethod = "delivery";
  let pickupPointId = "";
  try {
    const body = (await req.json()) as CheckoutBody;
    items = body.items;
    if (!Array.isArray(items) || items.length === 0) throw new Error();
    fulfillmentMethod = body.fulfillmentMethod === "pickup" ? "pickup" : "delivery";
    pickupPointId = text(body.pickupPointId, 80);
    customer = validateCustomer(body.customer, fulfillmentMethod);
    promoCode = text(body.promoCode, 80);
    orderNote = text(body.note, 500);
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
  const pickupPoint =
    fulfillmentMethod === "pickup"
      ? getPickupPoint(settings.pickup_points_json, pickupPointId)
      : null;
  if (fulfillmentMethod === "pickup" && !pickupPoint) {
    return NextResponse.json(
      { error: "Choisissez un point de retrait disponible." },
      { status: 400 }
    );
  }

  // Prix relus côté serveur — on ne fait jamais confiance au client
  const lineItems: {
    price_data: {
      currency: string;
      unit_amount: number;
      product_data: { name: string; description?: string; images?: string[] };
    };
    quantity: number;
  }[] = [];
  const metadataItems: { p: string; q: number; c: string; u: number; n?: string; v?: string; k?: string }[] = [];
  let subtotalCents = 0;
  let totalWeightGrams = 0;
  let missingBillableWeight = false;

  for (const item of items) {
    const product = await getProductById(item.productId);
    if (!product || !product.active) {
      return NextResponse.json(
        { error: "Un article du panier n'est plus disponible." },
        { status: 400 }
      );
    }
    const activeVariants = product.variants.filter((variant) => variant.active);
    const variant = activeVariants.find((candidate) => candidate.id === text(item.variantId, 80));
    if (activeVariants.length > 0 && !variant) {
      return NextResponse.json(
        { error: `Choisissez un modèle disponible pour « ${product.name} ».` },
        { status: 400 }
      );
    }
    const selectedStock = variant?.stock ?? product.stock;
    const selectedWeight = variant?.weightGrams || product.weightGrams;
    const selectedPrice = variant?.priceCents || product.priceCents;
    const maxQuantity = product.preorder ? 20 : selectedStock;
    const quantity = Math.max(1, Math.min(Number(item.quantity) || 1, maxQuantity));
    if (selectedStock <= 0 && !product.preorder) {
      return NextResponse.json(
        { error: `« ${product.name} » est épuisé pour le moment.` },
        { status: 400 }
      );
    }
    const customName = product.namePersonalizationEnabled
      ? normalizeCustomName(item.customName)
      : "";
    const keychainChoice = text(item.keychainChoice, 1);
    if (product.slug === "porte-canette-monster" && !["1", "2"].includes(keychainChoice)) {
      return NextResponse.json(
        { error: "Choisissez le modèle du porte-clés offert." },
        { status: 400 }
      );
    }
    const optionParts = [
      variant?.name || "",
      publicColorName(item.color),
      customName ? `Prénom : ${customName}` : "",
      keychainChoice ? `Porte-clés offert : choix ${keychainChoice}` : "",
    ].filter(Boolean);
    const unitAmount =
      discountedUnitPriceCents(selectedPrice, product.quantityDiscounts, quantity) +
      (customName ? product.namePersonalizationPriceCents : 0);
    subtotalCents += unitAmount * quantity;
    const pricedProduct = { ...product, weightGrams: selectedWeight };
    totalWeightGrams += billableProductWeight(pricedProduct, quantity);
    missingBillableWeight ||= hasMissingProductWeight(pricedProduct);
    lineItems.push({
      price_data: {
        currency: "eur",
        unit_amount: unitAmount,
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
      c: publicColorName(item.color || ""),
      u: unitAmount,
      ...(customName ? { n: customName } : {}),
      ...(variant ? { v: variant.id } : {}),
      ...(keychainChoice ? { k: keychainChoice } : {}),
    });
  }

  const shippingRates = parseShippingRates(settings.shipping_rates_json);
  const shipping = calculateShippingCents(totalWeightGrams || 1, shippingRates);
  const freeShipping =
    settings.free_shipping_threshold_cents > 0 &&
    subtotalCents >= settings.free_shipping_threshold_cents;
  const shippingCents = pickupPoint || freeShipping
    ? 0
    : missingBillableWeight
      ? Math.max(settings.shipping_flat_cents, shipping.priceCents)
      : totalWeightGrams === 0
        ? 0
        : shipping.priceCents;

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
            display_name: pickupPoint
              ? `Retrait · ${pickupPoint.name}`
              : freeShipping
                ? "Envoi offert"
                : missingBillableWeight
                  ? "Envoi · tarif standard"
                : `Envoi suivi · ${shipping.label}`,
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
        fulfillmentMethod,
        pickupPointId: pickupPoint?.id ?? "",
        pickupPointName: pickupPoint?.name ?? "",
        pickupPointAddress: pickupPoint?.address ?? "",
        pickupPointSchedule: pickupPoint?.schedule ?? "",
        promoCode,
        orderNote,
      },
      discounts: discounts.length ? discounts : undefined,
      success_url: `${siteUrl}/commande/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/commande/annulee`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("Stripe checkout :", e);
    return NextResponse.json(
      { error: "Impossible de préparer le paiement. Vérifiez la configuration de paiement." },
      { status: 502 }
    );
  }
}
