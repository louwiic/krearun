import { randomUUID } from "node:crypto";
import { getProducts } from "@/lib/store";
import SharedCartForm from "@/components/admin/SharedCartForm";

export default async function SharedCartPage() {
  const products = (await getProducts({ includeInactive: true })).filter(product => product.active);

  return <div className="mx-auto max-w-4xl">
    <h1 className="font-display text-3xl font-semibold">Panier à partager</h1>
    <p className="mb-6 mt-2 text-ink-soft">Composez le panier, fixez les frais de livraison et copiez le lien sécurisé à transmettre au client. Le lien Stripe est utilisable une seule fois et expire après 24 h.</p>
    <SharedCartForm products={products} requestId={randomUUID()} />
  </div>;
}
