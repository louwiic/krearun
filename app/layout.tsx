import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: "Cocon Studio — Objets imprimés en 3D, tout en douceur",
    template: "%s · Cocon Studio",
  },
  description:
    "Veilleuses, vases et petits objets du quotidien imprimés en 3D dans notre atelier familial. Des pièces douces, fabriquées lentement, à la commande.",
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
      </body>
    </html>
  );
}
