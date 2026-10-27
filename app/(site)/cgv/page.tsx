import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_DATE, LEGAL_VERSION, LEGAL_SECTIONS, GUARANTEE_PARAGRAPHS, WITHDRAWAL_TEMPLATE } from "@/lib/legal";
export const metadata: Metadata = {
  alternates: { canonical: "/cgv" }, title: "Conditions générales de vente" };
export default function CgvPage() {
  return <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
    <p className="text-xs font-bold text-ink-soft">Version {LEGAL_VERSION} · Mise à jour le {LEGAL_DATE}</p>
    <h1 className="mt-3 font-display text-4xl">Conditions générales de vente</h1>
    <div className="mt-6 flex flex-wrap gap-4 text-sm font-bold print:hidden"><Link className="underline" href="/retractation">Renoncer au contrat ici</Link><a className="underline" href="/retractation/modele">Télécharger le formulaire type</a><a className="underline" href={`/legal/cgv-${LEGAL_VERSION}.txt`} download>Télécharger les CGV</a></div>
    <p className="mt-4 text-sm text-ink-soft">Vous pouvez enregistrer ou imprimer cette page depuis votre navigateur.</p>
    <div className="mt-10 space-y-8">{LEGAL_SECTIONS.map(section => <section key={section.title}><h2 className="font-display text-xl">{section.title}</h2>{section.paragraphs.map(p => <p key={p} className="mt-3 text-sm leading-relaxed text-ink-soft">{p}</p>)}</section>)}</div>
    <section className="mt-10 rounded-2xl border-2 border-ink p-6"><h2 className="font-display text-xl">Encadré relatif aux garanties légales</h2><p className="mt-2 text-xs text-ink-soft">Annexe à l’article D. 211-2 du Code de la consommation — vente de biens</p>{GUARANTEE_PARAGRAPHS.map(p => <p key={p} className="mt-4 whitespace-pre-line text-sm leading-relaxed">{p}</p>)}</section>
    <section className="mt-10"><h2 className="font-display text-xl">Formulaire type de rétractation</h2><p className="mt-2 text-sm text-ink-soft">À compléter et renvoyer uniquement si vous souhaitez vous rétracter du contrat.</p><p className="mt-4 whitespace-pre-line rounded-xl border border-sand p-5 text-sm leading-relaxed">{WITHDRAWAL_TEMPLATE}</p></section>
  </div>;
}
