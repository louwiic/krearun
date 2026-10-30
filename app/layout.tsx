import type { Metadata } from "next";
import { siteOrigin } from "@/lib/seo";
import { Bricolage_Grotesque, Manrope, Archivo, Space_Mono } from "next/font/google";
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

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], weight: ["400", "600", "700", "800"] });
const spaceMono = Space_Mono({ variable: "--font-space-mono", subsets: ["latin"], weight: ["400", "700"] });

const siteUrl = siteOrigin();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Objets personnalisés à La Réunion · Kréarun",
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
      className={`${bricolage.variable} ${manrope.variable} ${archivo.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="grain min-h-full flex flex-col">
        <CartProvider>{children}</CartProvider>

      </body>
    </html>
  );
}
