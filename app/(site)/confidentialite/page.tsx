import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Politique de confidentialité" };

const contactEmail = "stdcreativ974@gmail.com";
const updatedAt = "19 septembre 2026";

type Section = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

const sections: Section[] = [
  {
    title: "Responsable du traitement",
    paragraphs: [
      `Krearun Studio, SIRET 85221187900022, est responsable du traitement des données personnelles collectées sur krearun.re. Pour toute question relative à vos données, vous pouvez écrire à ${contactEmail}.`,
    ],
  },
  {
    title: "Données collectées",
    paragraphs: [
      "Nous collectons uniquement les données nécessaires au fonctionnement de la boutique et aux services demandés.",
    ],
    items: [
      "identité et coordonnées : prénom, nom, e-mail, téléphone, adresse de livraison ou point de retrait ;",
      "données de commande : articles, options de personnalisation, coloris, montant, remise, mode de livraison, suivi et historique de commande ;",
      "données de compte : adresse e-mail, mot de passe chiffré et historique de commandes ;",
      "contenu volontairement transmis : message de contact, avis client et inscription à la newsletter.",
    ],
  },
  {
    title: "Pourquoi et sur quelle base légale",
    items: [
      "Préparer, facturer, expédier et suivre votre commande : exécution du contrat et mesures précontractuelles.",
      "Respecter les obligations comptables, fiscales et de lutte contre la fraude : obligation légale et intérêt légitime.",
      "Créer et sécuriser votre espace client, gérer les demandes et le service après-vente : exécution du contrat et intérêt légitime.",
      "Envoyer la newsletter, les offres et actualités : votre consentement. Vous pouvez le retirer à tout moment.",
      "Publier un avis client : votre démarche volontaire ; votre e-mail n’est jamais affiché publiquement.",
    ],
  },
  {
    title: "Données obligatoires ou facultatives",
    paragraphs: [
      "Les coordonnées nécessaires au paiement, à la livraison ou au retrait sont obligatoires pour finaliser une commande. Sans elles, nous ne pouvons pas exécuter la vente. L’inscription à la newsletter, la création d’un compte, les avis et les messages de contact sont facultatifs.",
    ],
  },
  {
    title: "Destinataires et prestataires",
    paragraphs: [
      "Seules les personnes autorisées de Krearun Studio accèdent aux données selon leurs besoins. Certains prestataires les reçoivent uniquement pour assurer le service demandé.",
    ],
    items: [
      "Stripe, pour le paiement sécurisé. Krearun Studio ne reçoit ni ne conserve les numéros de carte bancaire ;",
      "La Poste / Colissimo, lorsqu’une expédition est demandée, pour créer l’étiquette, transporter le colis et permettre son suivi ;",
      "PocketBase, utilisé pour la gestion sécurisée des produits, comptes, commandes et abonnements ;",
      "nos prestataires d’envoi d’e-mails, uniquement pour les confirmations de commande, le suivi et les communications auxquelles vous êtes inscrit(e).",
    ],
  },
  {
    title: "Transferts hors de l’Union européenne",
    paragraphs: [
      "Certains prestataires techniques, notamment Stripe ou un prestataire d’e-mail, peuvent traiter des données depuis des pays situés hors de l’Espace économique européen. Dans ce cas, les garanties prévues par la réglementation applicable sont mises en œuvre par le prestataire concerné, par exemple les clauses contractuelles types de la Commission européenne.",
    ],
  },
  {
    title: "Durées de conservation",
    items: [
      "Commandes et pièces comptables : pendant la durée nécessaire à la relation commerciale, puis archivées lorsque la loi l’impose, notamment jusqu’à 10 ans pour les documents comptables.",
      "Compte client : tant qu’il est utile à la gestion de vos commandes et de votre espace client, puis supprimé ou anonymisé à votre demande sous réserve des obligations légales de conservation.",
      "Newsletter : jusqu’au retrait de votre consentement ou à votre demande de désinscription.",
      "Messages de contact et avis : pendant le temps nécessaire au traitement de votre demande ou à la modération de l’avis, puis supprimés ou anonymisés lorsqu’ils ne sont plus utiles.",
    ],
  },
  {
    title: "Newsletter et avis clients",
    paragraphs: [
      `La newsletter est envoyée uniquement après votre accord explicite. Vous pouvez vous désinscrire à tout moment via les indications présentes dans les e-mails ou en écrivant à ${contactEmail}. Les avis sont modérés avant publication : seuls le prénom, la note, le message et le produit concerné peuvent apparaître sur le site.`,
    ],
  },
  {
    title: "Cookies et stockage local",
    paragraphs: [
      "Le site utilise des cookies strictement nécessaires au bon fonctionnement, notamment pour la session de votre compte. Le panier, les favoris et la fermeture temporaire de la fenêtre newsletter peuvent aussi être enregistrés dans le stockage local de votre navigateur. Aucun outil de mesure d’audience, cookie publicitaire ou pixel marketing n’est activé par défaut sur ce site.",
      "La page de paiement Stripe peut utiliser ses propres cookies techniques pour sécuriser la transaction.",
    ],
  },
  {
    title: "Sécurité et prise de décision",
    paragraphs: [
      "Nous mettons en œuvre des mesures techniques et organisationnelles adaptées afin de limiter l’accès non autorisé, la perte ou l’altération des données. Aucune décision produisant un effet juridique à votre égard n’est prise exclusivement de manière automatisée.",
    ],
  },
  {
    title: "Vos droits",
    paragraphs: [
      `Vous pouvez demander l’accès à vos données, leur rectification, leur effacement, la limitation du traitement, vous opposer à certains traitements et, lorsque cela s’applique, demander la portabilité de vos données. Pour exercer ces droits ou retirer votre consentement, écrivez à ${contactEmail}. Une pièce permettant de vérifier votre identité pourra être demandée en cas de doute raisonnable.`,
      "Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL.",
    ],
  },
];

export default function ConfidentialitePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-terra">
        Mis à jour le {updatedAt}
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Politique de confidentialité
      </h1>
      <p className="mt-5 text-sm leading-relaxed text-ink-soft">
        Cette politique explique quelles données sont utilisées par Krearun Studio,
        pourquoi elles le sont et comment exercer vos droits.
      </p>

      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-display text-xl font-semibold">{section.title}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="mt-2 text-sm leading-relaxed text-ink-soft">
                {paragraph}
              </p>
            ))}
            {section.items && (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-soft">
                {section.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            )}
          </section>
        ))}
        <section>
          <h2 className="font-display text-xl font-semibold">Informations complémentaires</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Retrouvez l’identité de l’éditeur et les informations d’hébergement dans les{" "}
            <Link className="font-semibold text-terra underline underline-offset-2" href="/mentions-legales">
              mentions légales
            </Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
