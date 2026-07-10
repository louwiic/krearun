import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import { getSettings } from "@/lib/store";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const announcement =
    settings.announcement.includes("Collection") && settings.announcement.includes("60")
      ? "Livraison sur toute l'île"
      : settings.announcement;

  return (
    <div className="flex min-h-screen flex-col">
      {announcement && (
        <div className="bg-ink px-4 py-2.5 text-center text-xs font-semibold tracking-wide text-cream">
          <span className="inline-flex items-center justify-center gap-2">
            <svg
              aria-hidden
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 3.5l3 2.5-.7 3.3 2.7 2.4-1.9 3.1.6 3.7-3.7 1-2.3-1.8-3.3 1.1-1.7-3.4-2.9-1.7 1.4-3.4-.5-3.7 3.5-1.2 2.1-2.9 3.7 1z"
              />
            </svg>
            {announcement}
          </span>
        </div>
      )}
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer
        instagram={settings.instagram}
        contactEmail={settings.contact_email}
      />
      <CartDrawer
        freeShippingThresholdCents={settings.free_shipping_threshold_cents}
        shippingRatesJson={settings.shipping_rates_json}
      />
    </div>
  );
}
