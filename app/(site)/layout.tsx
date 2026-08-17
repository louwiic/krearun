import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import NewsletterPopup from "@/components/site/NewsletterPopup";
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
        <div className="marquee-mask bg-terra py-2 text-cream">
          <div className="marquee-track text-[11px] font-bold uppercase tracking-[0.18em]">
            {[0, 1].map((dup) => (
              <span key={dup} aria-hidden={dup === 1} className="flex shrink-0 items-center">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span key={i} className="flex items-center">
                    <span className="px-6">{announcement}</span>
                    <span className="text-cream/70">✦</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
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
      <NewsletterPopup
        enabled={settings.newsletter_popup_enabled}
        discountPct={settings.newsletter_popup_discount_pct}
        delaySeconds={settings.newsletter_popup_delay_seconds}
        title={settings.newsletter_popup_title}
        text={settings.newsletter_popup_text}
        storeName={settings.store_name}
      />
    </div>
  );
}
