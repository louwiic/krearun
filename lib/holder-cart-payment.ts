import type Stripe from "stripe";
import { canPayHolder, type HolderRequest } from "./custom-holder";
import { isHolderDemo } from "./holder-cart";
import { HolderCheckoutConflict, withHolderCheckoutLocks } from "./holder-checkout-lock";
import { getHolderRequest, saveHolderCheckout } from "./store";

export async function openHolderCartCheckout(stripe: Stripe, params: Stripe.Checkout.SessionCreateParams, holders: HolderRequest[], customerId: string) {
  return withHolderCheckoutLocks(holders.map(holder => holder.id), async () => {
    const previousIds = new Set<string>();
    for (const quote of holders) {
      const holder = await getHolderRequest(quote.id);
      if (!holder || !canPayHolder(holder, customerId) || isHolderDemo(holder) || holder.decision?.id !== quote.decision?.id || holder.quantity !== quote.quantity) {
        throw new HolderCheckoutConflict("Une personnalisation a changé ou a déjà été réglée. Actualisez votre espace client.");
      }
      if (holder.stripeSessionId) previousIds.add(holder.stripeSessionId);
    }
    const previous = await Promise.all([...previousIds].map(id => stripe.checkout.sessions.retrieve(id)));
    if (previous.some(session => session.status === "complete")) {
      throw new HolderCheckoutConflict("Une personnalisation a déjà été réglée. Actualisez votre espace client avant de réessayer.");
    }
    for (const session of previous) {
      if (session.status === "open") await stripe.checkout.sessions.expire(session.id);
    }
    const session = await stripe.checkout.sessions.create(params);
    try {
      if (!session.url) throw new Error("Lien de paiement manquant.");
      for (const holder of holders) await saveHolderCheckout(holder.id, session.id);
      return session;
    } catch (error) {
      await stripe.checkout.sessions.expire(session.id).catch(() => undefined);
      throw error;
    }
  });
}
