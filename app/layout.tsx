import type { Metadata } from "next";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import { CartProvider } from "@/components/cart/CartContext";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Kréarun — Découvrez nos produits personnalisés",
    template: "%s · Kréarun",
  },
  description:
    "Découvrez nos produits personnalisés : vos idées, vos couleurs et vos prénoms prennent forme dans notre atelier à La Réunion.",
  openGraph: {
    type: "website",
    siteName: "Kréarun",
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
      className={`${bricolage.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="grain min-h-full flex flex-col">
        <CartProvider>{children}</CartProvider>

      </body>
    </html>
  );
}
