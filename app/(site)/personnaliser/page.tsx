import type { Metadata } from "next";
import PersonalizationChoices from "@/components/personalization/PersonalizationChoices";

export const metadata: Metadata = {
  alternates: { canonical: "/personnaliser" },
  title: "Choisissez votre objet à personnaliser",
  description: "Découvrez nos aperçus 3D et choisissez votre porte-boisson, clicker ou lettre avant de créer votre objet personnalisé.",
};

export default function PersonalizationPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-ink-soft">Vos idées prennent forme</p>
      <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-6xl">Quel objet allez-vous personnaliser ?</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">Choisissez votre objet, puis composez-le à votre image : un prénom, vos couleurs, votre logo. À vous de créer.</p>
      <PersonalizationChoices />
    </div>
  );
}
