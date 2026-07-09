import CheckoutForm from "./CheckoutForm";
import { getSettings } from "@/lib/store";

export default async function CartPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-terra">
        Finaliser la commande
      </p>
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        Votre panier
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-soft sm:text-base">
        Renseignez vos coordonnées ici, choisissez votre mode de récupération,
        puis passez au paiement sécurisé. Votre espace client sera préparé
        automatiquement après validation.
      </p>

      <CheckoutForm
        freeShippingThresholdCents={settings.free_shipping_threshold_cents}
        shippingRatesJson={settings.shipping_rates_json}
        pickupPointsJson={settings.pickup_points_json}
      />
    </div>
  );
}
