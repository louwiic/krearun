import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import {
  createOrder,
  decrementStock,
  getOrderByStripeSession,
  getProductById,
  getSettings,
} from "@/lib/store";
import { sendAdminNewOrder, sendOrderConfirmation } from "@/lib/email";
import type { OrderItem } from "@/lib/types";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET manquante" },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  const signature = req.headers.get("stripe-signature");
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature ?? "", secret);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Idempotence : ne pas recréer la commande si le webhook rejoue
    if (await getOrderByStripeSession(session.id)) {
      return NextResponse.json({ received: true });
    }

    const raw = session.metadata?.items;
    const parsed: { p: string; q: number; c: string }[] = raw
      ? JSON.parse(raw)
      : [];

    const items: OrderItem[] = [];
    for (const it of parsed) {
      const product = await getProductById(it.p);
      items.push({
        productId: it.p,
        name: product?.name ?? "Article",
        priceCents: product?.priceCents ?? 0,
        quantity: it.q,
        color: it.c,
        image: product?.images[0] ?? "",
      });
    }

    const details = session.collected_information?.shipping_details ??
      // fallback selon versions d'API
      (session as unknown as { shipping_details?: { name?: string; address?: Stripe.Address } })
        .shipping_details;
    const address = details?.address;

    const order = await createOrder({
      email: session.customer_details?.email ?? "",
      name: details?.name ?? session.customer_details?.name ?? "",
      phone: session.customer_details?.phone ?? "",
      addressLine1: address?.line1 ?? "",
      addressLine2: address?.line2 ?? "",
      city: address?.city ?? "",
      postalCode: address?.postal_code ?? "",
      country: address?.country ?? "FR",
      subtotalCents: session.amount_subtotal ?? 0,
      shippingCents: session.shipping_cost?.amount_total ?? 0,
      totalCents: session.amount_total ?? 0,
      status: "paid",
      stripeSessionId: session.id,
      trackingNumber: "",
      note: "",
      items,
    });

    await decrementStock(
      parsed.map((it) => ({ productId: it.p, quantity: it.q }))
    );

    // E-mails non bloquants : un échec d'envoi ne doit pas faire
    // rejouer le webhook (la commande est déjà enregistrée)
    try {
      const settings = await getSettings();
      await sendOrderConfirmation(order);
      await sendAdminNewOrder(order, settings.contact_email);
    } catch (e) {
      console.error("E-mails de commande :", e);
    }
  }

  return NextResponse.json({ received: true });
}
