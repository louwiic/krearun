export const LETTER_LAMP_SLUG = "lampe-lettre-personnalisee";
export const LOVE_LAMP_SLUG = "lampe-double-love";
export function isPersonalizedLamp(slug: string) {
  return slug === LETTER_LAMP_SLUG || slug === LOVE_LAMP_SLUG;
}
export interface LampPersonalization {
  initial: string;
  text: string;
  secondName: string;
  motif: string;
  otherMotif: string;
  hearts: string;
  inscription: string;
}
const clean = (value: string, max: number) => value.trim().replace(/\s+/g, " ").replace(/[|]/g, "/").slice(0, max);
export function buildLampPersonalization(slug: string, fields: LampPersonalization): string {
  const text = clean(fields.text, 32);
  if (slug === LETTER_LAMP_SLUG) {
    const initial = fields.initial.trim().toLocaleUpperCase("fr");
    const motif = fields.motif === "Autre" ? clean(fields.otherMotif, 32) : fields.motif;
    if (!/^\p{L}$/u.test(initial) || !text || !motif) return "";
    return `Lettre : ${initial} | Texte : ${text} | Motif : ${motif}`;
  }
  if (slug === LOVE_LAMP_SLUG) {
    if (!["1", "2"].includes(fields.hearts)) return "";
    const secondName = clean(fields.secondName, 24);
    if (!text || (fields.hearts === "2" && !secondName)) return "";
    const inscription = clean(fields.inscription, 32);
    return `Cœurs : ${fields.hearts} | Prénom 1 : ${text}${fields.hearts === "2" ? ` | Prénom 2 : ${secondName}` : ""}${inscription ? ` | Inscription : ${inscription}` : ""}`;
  }
  return "";
}
/** Keep the manufacturing details intact through checkout and reject incomplete requests. */
export function normalizeLampPersonalization(slug: string, value: unknown): string {
  if (typeof value !== "string") return "";
  const normalized = value.trim().replace(/\s+/g, " ");
  if (slug === LETTER_LAMP_SLUG && /^Lettre : \p{L} \| Texte : [^|]{1,32} \| Motif : [^|]{1,32}$/u.test(normalized)) return normalized;
  if (slug === LOVE_LAMP_SLUG && /^Cœurs : (?:1 \| Prénom 1 : [^|]{1,32}|2 \| Prénom 1 : [^|]{1,32} \| Prénom 2 : [^|]{1,24})(?: \| Inscription : [^|]{1,32})?$/u.test(normalized)) return normalized;
  return "";
}
