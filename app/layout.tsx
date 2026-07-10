import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
import Script from "next/script";
import { CartProvider } from "@/components/cart/CartContext";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

const nunito = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Krearun Studio — Objets doux fabriqués à la commande",
    template: "%s · Krearun Studio",
  },
  description:
    "Veilleuses, vases et petits objets du quotidien fabriqués dans notre atelier familial. Des pièces douces, préparées lentement, à la commande.",
  openGraph: {
    type: "website",
    siteName: "Krearun Studio",
    locale: "fr_FR",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Krearun Studio" }],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${fraunces.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="grain min-h-full flex flex-col">
        <CartProvider>{children}</CartProvider>
        <Script
          defer
          data-domain="krearun.re"
          src="https://analytics.peibox.fr/js/script.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
