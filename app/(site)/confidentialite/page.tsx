import { BUSINESS, BUSINESS_ADDRESS, LEGAL_DATE } from "@/lib/legal";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Politique de confidentialité" };

const contactEmail = BUSINESS.email;
const updatedAt = LEGAL_DATE;

type Section = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

const sections: Section[] = [
  {
    title: "Responsable du traitement",
    paragraphs: [
      `${BUSINESS.name}, entrepreneur individuel sous le nom commercial Kréarun, SIRET ${BUSINESS.siret}, ${BUSINESS_ADDRESS}, est responsable du traitement des données personnelles collectées sur krearun.re. Pour toute question relative à vos données, vous pouvez écrire à ${contactEmail}.`,
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
      "données de compte : adresse e-mail, mot de passe protégé par hachage et historique de commandes ;",
      "contenu volontairement transmis : message de contact, avis client, photo facultative jointe à un avis et inscription à la newsletter ; fichiers et logos adressés pour une demande de personnalisation ; déclarations de rétractation et coordonnées de réception de leur accusé.",
    ],
  },
  {
    title: "Pourquoi et sur quelle base légale",
    items: [
      "Préparer, facturer, expédier et suivre votre commande : exécution du contrat et mesures précontractuelles.",
      "Respecter les obligations comptables, fiscales et de lutte contre la fraude : obligation légale et intérêt légitime.",
      "Créer et sécuriser votre espace client, gérer les demandes et le service après-vente : exécution du contrat et intérêt légitime.",
      "Envoyer la newsletter, les offres et actualités : votre consentement. Vous pouvez le retirer à tout moment.",
      "Recevoir et conserver une déclaration de rétractation, en accuser réception et traiter un retour : exécution du contrat et obligations légales.",
      "Mesurer la fréquentation du site avec le script disponible sur analytics.peibox.fr : votre consentement préalable, retirable depuis les préférences de confidentialité.",
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
      "l’hébergeur de l’application et de sa base PocketBase, pour la gestion des comptes, commandes, demandes et abonnements ;",
      "Cloudflare, notamment son stockage R2, pour la distribution des médias et la protection du site ; les logos privés de personnalisation sont conservés avec des accès restreints ;",
      "le service de mesure d’audience auto-hébergé sur analytics.peibox.fr, seulement après votre accord ;",
      "nos prestataires d’envoi d’e-mails, uniquement pour les confirmations de commande, le suivi et les communications auxquelles vous êtes inscrit(e).",
    ],
  },
  {
    title: "Transferts hors de l’Union européenne",
    paragraphs: [
      "Certains prestataires techniques, notamment Stripe ou un prestataire d’e-mail, peuvent traiter des données depuis des pays situés hors de l’Espace économique européen. Dans ce cas, les garanties prévues par la réglementation applicable doivent être documentées pour le traitement concerné, notamment au moyen des garanties adaptées telles que les clauses contractuelles types de la Commission européenne.",
    ],
  },
  {
    title: "Durées de conservation",
    items: [
      "Commandes et pièces comptables : pendant la durée nécessaire à la relation commerciale, puis archivées lorsque la loi l’impose, notamment jusqu’à 10 ans pour les documents comptables.",
      "Compte client : tant qu’il est utile à la gestion de vos commandes et de votre espace client, puis supprimé ou anonymisé à votre demande sous réserve des obligations légales de conservation.",
      "Newsletter : jusqu’au retrait du consentement, ou au plus tard 3 ans après le dernier contact actif du prospect ; les données nécessaires à la preuve et à la gestion d’une opposition peuvent être conservées séparément.",
      "Déclarations de rétractation : conservation pour traiter la demande, puis archivage comme preuve pendant la durée de prescription applicable au litige, généralement 5 ans, sans préjudice des obligations comptables.",
      "Messages de contact et avis : pendant le temps nécessaire au traitement de votre demande ou à la modération de l’avis, puis supprimés ou anonymisés lorsqu’ils ne sont plus utiles.",
    ],
  },
  {
    title: "Newsletter et avis clients",
    paragraphs: [
      `La newsletter est envoyée uniquement après votre accord explicite. Vous pouvez vous désinscrire à tout moment via les indications présentes dans les e-mails ou en écrivant à ${contactEmail}. Les avis sont modérés avant publication : seuls le prénom, la note, le message, la photo facultative et le produit concerné peuvent apparaître sur le site.`,
    ],
  },
  {
    title: "Cookies et stockage local",
    paragraphs: [
      "Le site utilise des cookies strictement nécessaires, notamment pour la session de votre compte. Le panier, les favoris, la fermeture temporaire de la fenêtre newsletter et votre choix de confidentialité peuvent être enregistrés dans le stockage local du navigateur. Le script de mesure d’audience sur analytics.peibox.fr est chargé uniquement après votre acceptation. Avec ce même accord, les impressions de produits dans les listes, les clics vers une fiche et les vues de fiches produit sont comptés avec un identifiant d’événement aléatoire, le produit concerné, le type d’action et la date. Un repère temporaire dans le stockage de session limite les doublons ; aucun nom, e-mail, texte personnalisé ni adresse IP n’est enregistré dans ces statistiques produit. Les interactions avec le configurateur de lettre peuvent être comptées avec un identifiant de navigateur aléatoire, le type d’action et le format téléchargé ; aucun prénom saisi n’est joint à ces statistiques. Votre choix est mémorisé pendant environ six mois. Vous pouvez accepter ou refuser avec les boutons proposés, puis revenir sur votre choix via « Préférences de confidentialité » dans le pied de page. Le refus n’empêche pas les achats.",
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
