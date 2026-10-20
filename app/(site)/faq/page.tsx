import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ & livraison",
  description:
    "Délais de fabrication, livraison, retours, entretien : toutes les réponses sur nos objets.",
};

const faqs = [
  {
    q: "Quels sont les délais de fabrication et de livraison ?",
    a: "Chaque objet est fabriqué à la commande : comptez 2 à 4 jours ouvrés de préparation, puis 4 à 8 jours ouvrés de livraison suivie, sauf délai différent annoncé avant votre commande. Nous vous envoyons un e-mail à chaque étape, de l’atelier à votre boîte aux lettres.",
  },
  {
    q: "En quoi sont fabriqués vos objets ?",
    a: "Nous utilisons des matières légères, rigides et agréables au toucher. Les informations détaillées sur les matières sont disponibles dans les mentions légales. Pour les lampes, respectez l’alimentation et les consignes indiquées sur la fiche et la notice.",
  },
  {
    q: "Les couleurs sont-elles fidèles aux photos ?",
    a: "Nous faisons de notre mieux ! Les teintes peuvent très légèrement varier selon les lots de matière et votre écran. Chaque pièce étant fabriquée individuellement, de petites variations peuvent exister : c’est ce qui rend chaque objet unique.",
  },
  {
    q: "Puis-je retourner un article ?",
    a: "Pour les articles non personnalisés, vous disposez de 14 jours après réception pour notifier votre rétractation, puis de 14 jours pour retourner l’article. L’emballage d’origine est recommandé sans être obligatoire ; les manipulations nécessaires pour examiner le produit sont autorisées. Utilisez le lien « Renoncer au contrat ici » du pied de page. Les articles nettement personnalisés peuvent relever d’une exception, sans perdre leurs garanties légales.",
  },
  {
    q: "Comment entretenir mes objets ?",
    a: "Un chiffon doux et sec suffit. Évitez l’eau chaude et l’exposition prolongée en plein soleil derrière une vitre. Vos objets vous le rendront pendant des années.",
  },
  {
    q: "Proposez-vous des personnalisations ?",
    a: "Avec plaisir quand l’agenda de l’atelier le permet : couleur spéciale, petite gravure, format différent. Écrivez-nous via la page contact avec votre idée, on vous répond sous 48 h.",
  },
  {
    q: "Livrez-vous hors de France ?",
    a: "Les destinations proposées à la commande sont La Réunion et la France métropolitaine. Les frais et les options de retrait sont précisés avant le paiement. Pour une autre destination, contactez-nous avant de commander.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-terra">
        On vous répond
      </p>
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        Questions fréquentes
      </h1>
      <p className="mt-4 text-ink-soft">
        Et si la réponse n’est pas ici, écrivez-nous — on répond vite, et
        gentiment.
      </p>

      <div className="mt-12 space-y-4">
        {faqs.map((f) => (
          <details
            key={f.q}
            className="group rounded-blob bg-cream p-6 shadow-soft open:shadow-lifted"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold [&::-webkit-details-marker]:hidden">
              {f.q}
              <span className="shrink-0 text-terra transition-transform duration-300 group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
