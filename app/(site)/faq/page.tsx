import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ & livraison",
  description:
    "Délais de fabrication, livraison, retours, entretien : toutes les réponses sur nos objets.",
};

const faqs = [
  {
    q: "Quels sont les délais de fabrication et de livraison ?",
    a: "Chaque objet est fabriqué à la commande : comptez 2 à 4 jours de préparation, puis 2 à 4 jours de livraison suivie selon la destination. Nous vous envoyons un e-mail à chaque étape, de l'atelier à votre boîte aux lettres.",
  },
  {
    q: "En quoi sont fabriqués vos objets ?",
    a: "Nous utilisons des matières légères, rigides et agréables au toucher. Les informations détaillées sur les matières sont disponibles dans les mentions légales. Nos veilleuses utilisent des LED basse consommation qui ne chauffent pas.",
  },
  {
    q: "Les couleurs sont-elles fidèles aux photos ?",
    a: "Nous faisons de notre mieux ! Les teintes peuvent très légèrement varier selon les lots de matière et votre écran. Chaque pièce étant fabriquée individuellement, de petites variations peuvent exister : c'est ce qui rend chaque objet unique.",
  },
  {
    q: "Puis-je retourner un article ?",
    a: "Oui, vous disposez de 14 jours après réception pour changer d'avis. L'objet doit être renvoyé dans son emballage d'origine, non utilisé. Écrivez-nous, on vous explique tout en douceur.",
  },
  {
    q: "Comment entretenir mes objets ?",
    a: "Un chiffon doux et sec suffit. Évitez l'eau chaude et l'exposition prolongée en plein soleil derrière une vitre. Vos objets vous le rendront pendant des années.",
  },
  {
    q: "Proposez-vous des personnalisations ?",
    a: "Avec plaisir quand l'agenda de l'atelier le permet : couleur spéciale, petite gravure, format différent. Écrivez-nous via la page contact avec votre idée, on vous répond sous 48 h.",
  },
  {
    q: "Livrez-vous hors de France ?",
    a: "Nous livrons la France métropolitaine, la Belgique, le Luxembourg et la Suisse. Les frais sont calculés au moment du paiement. Pour une autre destination, contactez-nous.",
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
        Et si la réponse n'est pas ici, écrivez-nous — on répond vite, et
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
