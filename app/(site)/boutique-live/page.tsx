import type { Metadata } from "next";
import LiveShop from "@/components/site/LiveShop";

export const metadata: Metadata = {
  title: "KréaGame — acheter en jouant ! — Kréarun",
  description: "Balade ton personnage dans la boutique Kréarun en temps réel, choisis tes produits et passe en caisse, comme dans un magasin physique.",
  robots: { index: false },
};

export default function BoutiqueLivePage() {
  return <LiveShop />;
}
