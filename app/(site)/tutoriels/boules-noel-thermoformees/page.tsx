import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tutoriel : réaliser votre décoration de Noël thermoformée",
  description: "Du kit à la décoration : préparez les pièces, utilisez les moules réutilisables, mettez en forme puis assemblez votre décoration de Noël Kréarun.",
  alternates: { canonical: "/tutoriels/boules-noel-thermoformees" },
};

const steps = [
  ["Préparez votre espace", "Travaillez sur une surface stable qui résiste à la chaleur. Rassemblez les pièces plates, les moules adaptés à votre motif, les connecteurs et le cordon. Identifiez la face avant et la face arrière avant de chauffer."],
  ["Positionnez une pièce dans le moule", "Posez la première pièce plate dans le moule correspondant et centrez-la. Les moules sont spécifiques au motif : ne forcez pas une pièce dans un autre modèle."],
  ["Chauffez progressivement", "Utilisez un sèche-cheveux suffisamment puissant en mode air chaud, en respectant les consignes et la distance d’utilisation du fabricant. Déplacez le flux d’air pour chauffer la pièce uniformément. Arrêtez dès que le plastique devient souple. Ne chauffez pas directement vos mains."],
  ["Donnez la forme", "Utilisez la partie complémentaire du moule pour former la pièce assouplie, sans toucher le plastique chaud. Appuyez progressivement par les zones de prise du moule, sans forcer. Répétez pour les autres pièces du motif."],
  ["Laissez refroidir", "Gardez la pièce en place jusqu’à son refroidissement complet. Démoulez doucement : elle doit conserver sa forme sans être déformée par vos doigts. Si elle résiste, ne tirez pas sur le maillage."],
  ["Assemblez et décorez", "Rassemblez les éléments et fixez les connecteurs ou l’écrou fournis, selon le motif. Ajoutez le cordon d’accroche. Conservez vos moules pour les prochaines créations : ils sont réutilisables."],
];

export default function ThermoformedChristmasTutorial() {
  return <article className="editorial-section max-w-5xl">
    <Link href="/boutique?categorie=noel" className="text-sm underline underline-offset-4">← La collection de Noël</Link>
    <header className="my-10 max-w-3xl"><p className="editorial-eyebrow">Le petit atelier de Noël</p><h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">De la pièce plate à votre décoration.</h1><p className="mt-5 text-base leading-relaxed text-ink-soft">Vous avez choisi le kit complet ? Donnez vous-même sa forme à votre décoration, puis assemblez-la. Les pièces imprimées et les moules réutilisables sont fournis ; le sèche-cheveux est à prévoir chez vous.</p></header>
    <section className="grid gap-6 border-y border-sand py-7 sm:grid-cols-2" aria-label="Choisir sa formule">
      <div><h2 className="font-display text-xl font-bold">Le kit complet</h2><p className="mt-3 text-sm leading-relaxed text-ink-soft">Pièces plates du motif choisi, moules de thermoformage correspondants, connecteurs nécessaires et cordon. Une décoration à réaliser, avec des moules à garder.</p></div>
      <div><h2 className="font-display text-xl font-bold">Déjà thermoformée</h2><p className="mt-3 text-sm leading-relaxed text-ink-soft">Nous mettons la décoration en forme et l’assemblons à l’atelier. Elle est livrée avec son cordon, prête à installer. Les moules ne sont pas inclus dans cette formule.</p></div>
    </section>
    <div className="my-10 grid gap-5 sm:grid-cols-2">{steps.map(([title,text], index) => <section key={title} className="rounded-2xl border border-sand p-6"><span className="editorial-eyebrow text-terra-deep">0{index+1}</span><h2 className="mt-3 font-display text-xl font-bold">{title}</h2><p className="mt-3 text-sm leading-relaxed text-ink-soft">{text}</p></section>)}</div>
    <aside className="rounded-2xl bg-white p-6 text-sm leading-relaxed"><h2 className="font-display text-xl font-bold">Un moment créatif, avec quelques précautions.</h2><p className="mt-3">La mise en forme à chaud est réalisée par un adulte. Éloignez les enfants et les mains du flux d’air chaud ; laissez refroidir les pièces avant de les manipuler. N’utilisez ni flamme, ni four, ni micro-ondes. Les décorations ne sont pas des jouets.</p><p className="mt-3">La puissance des sèche-cheveux varie : si votre appareil n’assouplit pas correctement la pièce, arrêtez et contactez l’atelier. Ne compensez pas en rapprochant excessivement l’appareil ou en chauffant trop longtemps.</p><p className="mt-3">Les décorations sont vendues vides, sans bonbons ni guirlande. N’y placez pas de bougie, d’ampoule chaude ou d’aliment non emballé. Évitez le soleil direct et les fortes chaleurs après la mise en forme.</p></aside>
    <div className="my-10 flex flex-wrap gap-4"><Link href="/boutique?categorie=noel" className="editorial-pill">Choisir ma décoration ↗</Link><Link href="/contact" className="editorial-pill">Une question ?</Link></div>
    <p className="text-xs text-ink-soft">Principe de thermoformage et d’assemblage : <a href="https://makerworld.com/fr/models/2072645-thermoformed-christmas-baubles" target="_blank" rel="noopener noreferrer" className="underline">créations MIHAI_T</a>. Les étapes s’adaptent au motif et aux moules fournis dans votre kit.</p>
  </article>;
}
