import type { Metadata } from "next";

export const metadata: Metadata = { title: "Conditions générales de vente" };

const sections = [
  {
    t: "1. Objet",
    c: "Les présentes conditions régissent les ventes conclues sur la boutique en ligne Krearun Studio, spécialisée dans la vente d'objets de décoration et d'accessoires fabriqués par impression 3D.",
  },
  {
    t: "2. Prix",
    c: "Les prix sont indiqués en euros, toutes taxes comprises. Les frais de livraison sont précisés avant la validation de la commande. Krearun Studio se réserve le droit de modifier ses prix à tout moment ; les produits sont facturés au tarif en vigueur au moment de la commande.",
  },
  {
    t: "3. Commande et fabrication",
    c: "Les objets étant imprimés à la commande, le délai de fabrication est de 2 à 4 jours ouvrés avant expédition. La commande est confirmée par e-mail après paiement.",
  },
  {
    t: "4. Paiement",
    c: "Le paiement s'effectue en ligne par carte bancaire via une plateforme de paiement sécurisée. Aucune donnée bancaire n'est conservée par Krearun Studio.",
  },
  {
    t: "5. Livraison et retrait",
    c: "Les commandes peuvent être envoyées en suivi ou retirées sur un point proposé au moment de la commande, selon les options disponibles. Les retraits sont principalement organisés le week-end, sur créneau confirmé après paiement.",
  },
  {
    t: "6. Droit de rétractation",
    c: "Conformément à la loi, le client dispose d'un délai de 14 jours à compter de la réception pour exercer son droit de rétractation, sans avoir à motiver sa décision. Le produit doit être retourné complet, non utilisé et dans son emballage d'origine. Les frais de retour restent à la charge du client.",
  },
  {
    t: "7. Garanties",
    c: "Tous nos produits bénéficient de la garantie légale de conformité et de la garantie contre les vices cachés. En cas de produit défectueux, contactez-nous : nous remplaçons ou remboursons.",
  },
  {
    t: "8. Service client",
    c: "Pour toute question, notre équipe est joignable par e-mail. Nous nous engageons à répondre sous 48 heures ouvrées.",
  },
];

export default function CgvPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        Conditions générales de vente
      </h1>
      <div className="mt-10 space-y-8">
        {sections.map((s) => (
          <section key={s.t}>
            <h2 className="font-display text-xl font-semibold">{s.t}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.c}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
