import Link from "next/link";
import { PrivateSaleForm } from "@/components/admin/PrivateSaleForm";

export default function PrivateSalePage() {
  return <div className="mx-auto max-w-3xl">
    <Link href="/admin/produits" className="text-sm font-semibold text-ink-soft">← Retour aux produits</Link>
    <h1 className="mt-4 font-display text-3xl font-semibold">Créer une offre sur mesure</h1>
    <p className="mb-8 mt-3 text-ink-soft">Fixez le prix d’une demande particulière et partagez son lien au client. L’offre reste hors du catalogue et des sites partenaires. Toute personne disposant du lien pourra la commander et payer sur le site.</p>
    <PrivateSaleForm />
  </div>;
}
