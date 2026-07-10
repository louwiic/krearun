import type { Metadata } from "next";

export const metadata: Metadata = { title: "Politique de confidentialité" };

const contactEmail = "stdcreativ974@gmail.com";

const sections = [
  {
    title: "Responsable du traitement",
    body: `Krearun Studio, SIRET 85221187900022, est responsable du traitement des données collectées sur ce site. Pour toute question : ${contactEmail}.`,
  },
  {
    title: "Données collectées",
    body: "Nous collectons uniquement les informations nécessaires au fonctionnement de la boutique : nom, prénom, e-mail, téléphone, adresse de livraison ou point de retrait, contenu du panier, commande, message de contact, inscription newsletter et avis client laissé volontairement.",
  },
  {
    title: "Finalités",
    body: "Ces données servent à traiter les commandes, organiser la livraison ou le retrait, assurer le suivi client, répondre aux messages, envoyer les e-mails nécessaires, gérer la newsletter avec votre accord et modérer les avis clients.",
  },
  {
    title: "Avis clients",
    body: "Lorsqu'un avis est envoyé, il reste en attente de validation. Seuls le prénom, la note, le message et le produit concerné peuvent être affichés publiquement après validation. L'e-mail n'est jamais publié.",
  },
  {
    title: "Durée de conservation",
    body: "Les données de commande sont conservées pendant la durée nécessaire aux obligations comptables et commerciales. Les données newsletter sont conservées jusqu'au désabonnement. Les demandes de contact et avis peuvent être supprimés sur demande.",
  },
  {
    title: "Vos droits",
    body: `Vous pouvez demander l'accès, la rectification ou la suppression de vos données en écrivant à ${contactEmail}.`,
  },
  {
    title: "Cookies",
    body: "Le site utilise uniquement les cookies ou stockages nécessaires au panier, à la session et au bon fonctionnement de la boutique. Aucun cookie publicitaire n'est déposé par défaut.",
  },
];

export default function ConfidentialitePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        Politique de confidentialité
      </h1>
      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-display text-xl font-semibold">{section.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
