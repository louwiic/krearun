import { validatedLetter } from "@/lib/custom-letter-server";
import { CUSTOM_LETTER_PRICE_CENTS } from "@/lib/custom-letter-settings";
import { getSettings } from "@/lib/store";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { letterCheckoutParams } from "@/lib/custom-letter-checkout";

export async function POST(request: Request) {
  if (!stripeConfigured()) return Response.json({ error: "Le paiement est momentanément indisponible." }, { status: 503 });
  let letter: Awaited<ReturnType<typeof validatedLetter>>;
  try { letter = await validatedLetter((await request.json()).configuration); }
  catch { return Response.json({ error: "Configuration de lettre invalide." }, { status: 400 }); }
  try {
    const settings = await getSettings();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const shippingCents = settings.free_shipping_threshold_cents > 0 && CUSTOM_LETTER_PRICE_CENTS >= settings.free_shipping_threshold_cents ? 0 : Math.max(0, settings.shipping_flat_cents);
    const session = await getStripe().checkout.sessions.create(letterCheckoutParams(letter.configuration, shippingCents, siteUrl));
    return Response.json({ url: session.url });
  } catch {
    console.error("[Custom letter] Checkout creation failed");
    return Response.json({ error: "Impossible de préparer le paiement. Réessayez." }, { status: 502 });
  }
}
