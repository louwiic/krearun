"use client";

import { LETTER_LAMP_SLUG, type LampPersonalization as Configuration } from "@/lib/lamp-personalization";

export default function LampPersonalization({ slug, value, onChange }: { slug: string; value: Configuration; onChange: (value: Configuration) => void }) {
  const inputClass = "mt-2 w-full rounded-[10px] border border-sand bg-cream px-4 py-3 text-sm outline-none focus:border-ink";
  function field(key: keyof Configuration, label: string, maxLength: number, placeholder: string, required = true) {
    return <label className="block text-sm font-bold">{label}{required ? " *" : ""}<input value={value[key]} onChange={event => onChange({ ...value, [key]: event.target.value })} maxLength={maxLength} placeholder={placeholder} required={required} className={inputClass} /></label>;
  }
  return <fieldset className="space-y-4 rounded-2xl border-2 border-ink bg-linen p-5">
    <legend className="px-2 text-sm font-bold">Personnalisez votre lampe — inclus</legend>
    {slug === LETTER_LAMP_SLUG ? <>
      {field("initial", "Lettre de la lampe", 1, "Ex. L")}
      {field("text", "Texte ou prénom", 32, "Ex. Louane")}
      <label className="block text-sm font-bold">Symboles décoratifs<select value={value.motif} onChange={event => onChange({ ...value, motif: event.target.value })} className={inputClass}>
        {["Étoiles", "Cœurs", "Lunes", "Fleurs", "Autre"].map(motif => <option key={motif}>{motif}</option>)}
      </select></label>
      {value.motif === "Autre" && field("otherMotif", "Votre idée de symbole", 32, "Ex. papillons")}
      <p className="text-xs text-ink-soft">Les étoiles sont le motif par défaut. Pour un autre symbole, nous vous contactons si un ajustement est nécessaire.</p>
    </> : <>
      <label className="block text-sm font-bold">Forme de la lampe<select value={value.hearts} onChange={event => onChange({ ...value, hearts: event.target.value })} className={inputClass}><option value="1">Un cœur</option><option value="2">Deux cœurs</option></select></label>
      {field("text", value.hearts === "2" ? "Premier prénom" : "Prénom ou texte", 32, "Ex. Emmanuel")}
      {value.hearts === "2" && field("secondName", "Deuxième prénom", 24, "Ex. Ketty")}
      {field("inscription", "Petite inscription (facultatif)", 32, "Ex. une date ou quelques mots", false)}
    </>}
    <p className="text-xs text-ink-soft">Photo d’exemple. Votre lampe sera fabriquée avec les informations saisies ci-dessus.</p>
  </fieldset>;
}
