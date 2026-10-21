"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { trackLetterEvent } from "@/lib/letter-tracking";

function LoadingPreview() {
  return <div role="status" className="flex h-[280px] items-center justify-center text-sm text-ink-soft">Chargement de l’aperçu 3D…</div>;
}

const HolderPreview = dynamic(() => import("@/components/custom-holder/HolderPreview3D"), { ssr: false, loading: LoadingPreview });
const ClickerPreview = dynamic(() => import("@/components/clicker/ClickerOrbitPreview"), { ssr: false, loading: LoadingPreview });
const LetterExample = dynamic(() => import("./LetterExample"), { ssr: false, loading: LoadingPreview });

const choices = [
  { id: "holder", name: "Porte-boisson", detail: "Votre logo, vos couleurs", description: "Un porte-boisson 500 ml avec poignée, à personnaliser avec votre logo et vos textes.", href: "/boutique/porte-boisson-500ml-personnalise", action: "Personnaliser mon porte-boisson" },
  { id: "clicker", name: "Clicker", detail: "Un petit clic à votre image", description: "Composez votre clicker avec un texte, un symbole et les couleurs qui vous plaisent.", href: "/clicker-studio", action: "Personnaliser mon clicker" },
  { id: "letter", name: "Lettre", detail: "Une initiale, votre prénom", description: "Créez votre lettre décorative avec un prénom et votre duo de couleurs.", href: "/lettre-personnalisee", action: "Personnaliser ma lettre" },
] as const;

export default function PersonalizationChoices() {
  return (
    <div className="mt-10 grid gap-6 md:grid-cols-3">
      {choices.map((choice, index) => (
        <article key={choice.id} className="flex overflow-hidden rounded-2xl border-2 border-ink bg-white/60 flex-col">
          <div className="pointer-events-none relative overflow-hidden border-b border-ink/15" aria-label={`Exemple de ${choice.name.toLowerCase()} en 3D`}>
            {choice.id === "holder" && <div className="[&>div>div]:h-[280px]"><HolderPreview thumbnail configuration={{ model: "custom", logoFaces: 2, bodyColor: "#171717", bodyColorName: "Noir", topColor: "#f67340", bottomColor: "#f67340", logoWidth: 45, logoOffset: 0 }} /></div>}
            {choice.id === "clicker" && <ClickerPreview thumbnail text="KREA" symbol="♥" baseColor="#171717" capColor="#b5dff2" letterColor="#171717" />}
            {choice.id === "letter" && <LetterExample />}
            <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">Aperçu 3D</span>
          </div>
          <div className="flex flex-1 flex-col p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">0{index + 1} / {choice.detail}</p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight">{choice.name}</h2>
            <p className="mb-7 mt-3 text-sm leading-relaxed text-ink-soft">{choice.description}</p>
            <Link href={choice.href} onClick={() => { if (choice.id === "letter") trackLetterEvent("click"); }} className="mt-auto flex min-h-12 items-center justify-between gap-3 rounded-xl bg-ink px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-terra hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-terra">{choice.action}<span aria-hidden="true">↗</span></Link>
          </div>
        </article>
      ))}
    </div>
  );
}
