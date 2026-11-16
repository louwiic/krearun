import CartReminderSignup from "@/components/cart/CartReminderSignup";
import CheckoutForm from "./CheckoutForm";
import { getCustomerSession } from "@/lib/customer-auth";
import { getSettings, getCustomerById } from "@/lib/store";

export default async function CartPage() {
  const [settings, session] = await Promise.all([getSettings(), getCustomerSession()]);
  const customer = session ? await getCustomerById(session.id) : null;
  const [firstName = "", ...lastName] = customer?.name.trim().split(/\s+/) ?? [];

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
        puis validez votre commande. Votre espace client sera préparé
        automatiquement après validation.
      </p>

      {settings.cart_email_reminder_enabled && <CartReminderSignup />}

      <CheckoutForm
        initialCustomer={customer ? {email: customer.email, firstName, lastName: lastName.join(" "), phone: customer.phone, addressLine1: customer.addressLine1, addressLine2: customer.addressLine2, postalCode: customer.postalCode, city: customer.city, country: customer.country === "FR" ? "FR" : "RE"} : undefined}
        nameGiftEnabled={settings.cart_name_gift_enabled}
        nameGiftContent={{
          title: settings.express_offer_title || "Finalisez votre achat : votre porte-clés prénom est offert !",
          description: settings.express_offer_description || "Un porte-clés personnalisé offert par commande payée, ajouté à votre colis.",
          image: settings.express_offer_image || "/offers/porte-cles-prenom.png",
          cta: settings.express_offer_cta || "Je choisis mon cadeau",
        }}
        freeShippingThresholdCents={settings.free_shipping_threshold_cents}
        shippingFlatCents={settings.shipping_flat_cents}
        shippingRatesJson={settings.shipping_rates_json}
        metropolitanShippingRatesJson={settings.metropolitan_shipping_rates_json ?? ""}
        pickupPointsJson={settings.pickup_points_json}
      />
    </div>
  );
}
