import type Stripe from "stripe";
import { holderOrderItem, isHolderDemo } from "./holder-cart";
import { canPayHolder } from "./custom-holder";
import { getHolderRequest, markHolderPaid } from "./store";
import type { Order } from "./types";

export async function paidHolderCartItem(session: Stripe.Checkout.Session, line: { v?: string; q: number; u?: number }) {
  const holder = await getHolderRequest(line.v ?? "");
  if (!holder || !canPayHolder(holder, session.metadata?.holderCustomerId ?? "") || isHolderDemo(holder) ||
      holder.stripeSessionId !== session.id || holder.quantity !== line.q || holder.decision?.unitPriceCents !== line.u ||
      !["paid", "no_payment_required"].includes(session.payment_status) || session.currency !== "eur") {
    throw new Error("Paiement incohérent avec la demande validée.");
  }
  return holderOrderItem(holder);
}

export async function linkHolderCartOrder(order: Order) {
  for (const item of order.items) {
    if (!item.holderRequestId) continue;
    const holder = await getHolderRequest(item.holderRequestId);
    if (holder?.orderId === order.id) continue;
    if (!holder || holder.orderId || holder.stripeSessionId !== order.stripeSessionId) throw new Error("Demande déjà associée à une autre commande.");
    await markHolderPaid(holder.id, order.id);
  }
}
