import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import {
  createOrder,
  createCustomerActivationToken,
  decrementStock,
  ensureCustomerAccount,
  getOrderByStripeSession,
  getProductById,
  getSettings,
} from "@/lib/store";
import {
  sendAdminNewOrder,
  sendCustomerActivation,
  sendOrderConfirmation,
} from "@/lib/email";
import type { CheckoutCustomer, OrderItem } from "@/lib/types";

function metadataCustomer(session: Stripe.Checkout.Session): CheckoutCustomer | null {
  const metadata = session.metadata ?? {};
  const email = metadata.customerEmail || session.customer_details?.email || "";
  const firstName = metadata.customerFirstName || "";
  const lastName = metadata.customerLastName || "";
  const isPickup = metadata.fulfillmentMethod === "pickup";
  const addressLine1 = metadata.addressLine1 || "";
  const city = metadata.city || "";
  const postalCode = metadata.postalCode || "";
  if (!email || !firstName || !lastName) {
    return null;
  }
  if (!isPickup && (!addressLine1 || !city || !postalCode)) {
    return null;
  }
  return {
    email,
    firstName,
    lastName,
    phone: metadata.customerPhone || session.customer_details?.phone || "",
    addressLine1: isPickup ? metadata.pickupPointAddress || addressLine1 : addressLine1,
    addressLine2: metadata.addressLine2 || "",
    city: isPickup ? metadata.pickupPointName || city : city,
    postalCode: isPickup ? "" : postalCode,
    country: metadata.country || "RE",
  };
}

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
    const parsed: { p: string; q: number; c: string; n?: string }[] = raw
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
        customName: it.n,
        image: product?.images[0] ?? "",
      });
    }

    const customer = metadataCustomer(session);
    const details = session.collected_information?.shipping_details ??
      // fallback selon versions d'API
      (session as unknown as { shipping_details?: { name?: string; address?: Stripe.Address } })
        .shipping_details;
    const address = details?.address;
    const name = customer
      ? `${customer.firstName} ${customer.lastName}`.trim()
      : details?.name ?? session.customer_details?.name ?? "";
    const isPickup = session.metadata?.fulfillmentMethod === "pickup";
    const pickupNote = isPickup
      ? [
          "Retrait choisi par le client",
          session.metadata?.pickupPointName ? `Point : ${session.metadata.pickupPointName}` : "",
          session.metadata?.pickupPointAddress
            ? `Adresse : ${session.metadata.pickupPointAddress}`
            : "",
          session.metadata?.pickupPointSchedule
            ? `Créneau : ${session.metadata.pickupPointSchedule}`
            : "",
        ]
          .filter(Boolean)
          .join("\n")
      : "";

    const order = await createOrder({
      email: customer?.email ?? session.customer_details?.email ?? "",
      name,
      phone: customer?.phone ?? session.customer_details?.phone ?? "",
      addressLine1: customer?.addressLine1 ?? address?.line1 ?? "",
      addressLine2: customer?.addressLine2 ?? address?.line2 ?? "",
      city: customer?.city ?? address?.city ?? "",
      postalCode: customer?.postalCode ?? address?.postal_code ?? "",
      country: customer?.country ?? address?.country ?? "RE",
      subtotalCents: session.amount_subtotal ?? 0,
      shippingCents: session.shipping_cost?.amount_total ?? 0,
      totalCents: session.amount_total ?? 0,
      status: "paid",
      stripeSessionId: session.id,
      trackingNumber: "",
      note: pickupNote,
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
      if (customer) {
        try {
          const account = await ensureCustomerAccount(customer);
          if (account.created) {
            const token = await createCustomerActivationToken(account.email);
            await sendCustomerActivation(account.email, name, token);
          }
        } catch (e) {
          console.error("Compte client :", e);
        }
      }
      await sendAdminNewOrder(order, settings.contact_email);
    } catch (e) {
      console.error("E-mails de commande :", e);
    }
  }

  return NextResponse.json({ received: true });
}
