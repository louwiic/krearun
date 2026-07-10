import type { Metadata } from "next";

export const metadata: Metadata = { title: "Conditions générales de vente" };

const sections = [
  {
    t: "1. Objet",
    c: "Les présentes conditions générales de vente régissent les commandes passées sur la boutique en ligne Krearun Studio pour des objets de décoration, accessoires et créations fabriqués à la commande.",
  },
  {
    t: "2. Produits",
    c: "Les photographies et descriptions présentent les produits le plus fidèlement possible. De légères variations de couleur, de texture ou de finition peuvent exister d'une pièce à l'autre, chaque objet étant préparé individuellement.",
  },
  {
    t: "3. Prix",
    c: "Les prix sont indiqués en euros, toutes taxes comprises. Les frais de livraison sont précisés avant la validation de la commande. Krearun Studio se réserve le droit de modifier ses prix à tout moment ; les produits sont facturés au tarif en vigueur au moment de la commande.",
  },
  {
    t: "4. Commande et fabrication",
    c: "La commande est confirmée par e-mail après validation du paiement. Les produits étant fabriqués à la commande, un délai de préparation de 2 à 4 jours ouvrés est généralement nécessaire avant envoi ou retrait.",
  },
  {
    t: "5. Paiement",
    c: "Le paiement s'effectue en ligne par carte bancaire via une plateforme de paiement sécurisée. Aucune donnée bancaire n'est conservée par Krearun Studio.",
  },
  {
    t: "6. Livraison et retrait",
    c: "Les commandes peuvent être envoyées en suivi ou retirées sur un point proposé au moment de la commande, selon les options disponibles. Les retraits sont principalement organisés le week-end, sur créneau confirmé après paiement.",
  },
  {
    t: "7. Droit de rétractation",
    c: "Le client consommateur dispose d'un délai de 14 jours à compter de la réception pour exercer son droit de rétractation, sauf exception légale applicable aux produits personnalisés selon ses indications. Le produit retourné doit être complet, non utilisé et correctement protégé. Les frais de retour restent à la charge du client, sauf erreur de notre part.",
  },
  {
    t: "8. Produits personnalisés",
    c: "Lorsqu'une commande comporte un prénom, une couleur spéciale ou une demande personnalisée validée avec le client, elle est fabriquée selon ces indications. Ces produits peuvent ne pas bénéficier du droit de rétractation lorsqu'ils sont nettement personnalisés.",
  },
  {
    t: "9. Garanties légales",
    c: "Les produits bénéficient de la garantie légale de conformité et de la garantie contre les vices cachés. En cas de produit reçu abîmé, non conforme ou défectueux, contactez-nous avec des photos afin que nous puissions proposer une solution adaptée : remplacement, réparation ou remboursement.",
  },
  {
    t: "10. Utilisation et entretien",
    c: "Les objets sont destinés à un usage décoratif ou domestique normal. Ils doivent être tenus éloignés des fortes chaleurs, flammes, lave-vaisselle et expositions prolongées en plein soleil. Les objets décoratifs ne sont pas des jouets et doivent rester hors de portée des jeunes enfants lorsque de petites pièces sont présentes.",
  },
  {
    t: "11. Données personnelles",
    c: "Les données collectées lors de la commande sont utilisées pour traiter la vente, créer l'espace client, assurer le suivi et envoyer les informations nécessaires. Elles ne sont pas revendues. Le client peut exercer ses droits d'accès, de rectification ou de suppression via l'adresse de contact indiquée dans les mentions légales.",
  },
  {
    t: "12. Service client",
    c: "Pour toute question, notre équipe est joignable par e-mail. Nous nous engageons à répondre sous 48 heures ouvrées.",
  },
  {
    t: "13. Droit applicable",
    c: "Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable sera recherchée en priorité avant toute procédure.",
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
