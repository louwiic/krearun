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

  return (
    <div className="flex min-h-screen flex-col">
      {settings.announcement && (
        <div className="bg-ink px-4 py-2.5 text-center text-xs font-semibold tracking-wide text-cream">
          {settings.announcement}
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
      />
    </div>
  );
}
