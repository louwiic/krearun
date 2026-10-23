import type { Metadata } from "next";
import Newsletter from "@/components/site/Newsletter";

export const metadata: Metadata = {
  title: "Les nouvelles de l’atelier",
  description: "Inscrivez-vous à la newsletter Kréarun pour recevoir les nouveautés et les idées de l’atelier.",
  alternates: { canonical: "/newsletter" },
};

export default function NewsletterPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-20">
      <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">L’atelier Kréarun</p>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">Les nouvelles de l’atelier</h1>
      <p className="mt-5 text-lg leading-relaxed text-ink-soft">Nouveautés, coulisses et idées à personnaliser : inscrivez-vous pour recevoir nos nouvelles par e-mail.</p>
      <div className="mt-8 rounded-2xl border-2 border-ink bg-cream p-5 sm:p-8"><Newsletter /></div>
      <p className="mt-4 text-sm text-ink-soft">Désinscription possible à tout moment.</p>
    </div>
  );
}
