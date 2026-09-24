import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.carrelage-rs.re"),
  title: "Carrelage RS - Entreprise de carrelage a La Reunion",
  description:
    "Carrelage RS realise la pose de carrelage, faience, pierre naturelle, douche a l'italienne et renovation de piscine a La Reunion.",
  openGraph: {
    title: "Carrelage RS",
    description: "Entreprise de carrelage a La Reunion",
    images: ["/site/Accueil-Apropos-002.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
