import { colissimoCountry, ColissimoValidationError } from "./colissimo";

export type ColissimoRecipient = {
  name: string; addressLine1: string; addressLine2: string; postalCode: string;
  city: string; country: string; email: string; phone: string;
};
export const recipientFields = ["name", "addressLine1", "addressLine2", "postalCode", "city", "country", "email", "phone"] as const;
const postalText = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/œ/gi, "oe").replace(/æ/gi, "ae").replace(/[,;\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().toUpperCase();

export function formatColissimoRecipient(input: ColissimoRecipient): ColissimoRecipient {
  let addressLine1 = postalText(input.addressLine1);
  let addressLine2 = postalText(input.addressLine2);
  // Wrap at word boundaries only. Never truncate a delivery instruction or street.
  if (addressLine1.length > 35) {
    const words = `${addressLine1} ${addressLine2}`.trim().split(" ");
    const first: string[] = [];
    while (words.length && [...first, words[0]].join(" ").length <= 35) first.push(words.shift()!);
    if (first.length) { addressLine1 = first.join(" "); addressLine2 = words.join(" "); }
  }
  const postalCode = input.postalCode.trim().replace(/\s+/g, " ").toUpperCase();
  return {
    name: postalText(input.name), addressLine1, addressLine2, postalCode,
    city: postalText(input.city), country: colissimoCountry(input.country, postalCode),
    email: input.email.trim(), phone: input.phone.trim().replace(/\s+/g, " "),
  };
}

export function colissimoRecipientErrors(value: ColissimoRecipient): string[] {
  const errors: string[] = [];
  for (const [key, label] of [["name", "Nom"], ["addressLine1", "Numéro et rue"], ["addressLine2", "Complément d’adresse"], ["city", "Ville"]] as const) {
    if (key !== "addressLine2" && !value[key]) errors.push(`${label} : champ obligatoire.`);
    if (value[key].length > 35) errors.push(`${label} : 35 caractères maximum (${value[key].length} actuellement). Répartissez ou reformulez sans perdre d’information.`);
  }
  if (!/^[A-Z]{2}$/.test(value.country)) errors.push("Pays : renseignez le code ISO à deux lettres (RE, FR…).");
  if (!value.postalCode || value.postalCode.length > 10 || /[\r\n]/.test(value.postalCode)) errors.push("Code postal : entre 1 et 10 caractères.");
  if (["FR", "RE", "GP", "MQ", "GF", "YT", "BL", "MF"].includes(value.country) && !/^\d{5}$/.test(value.postalCode)) errors.push("Code postal : 5 chiffres requis pour cette destination.");
  if (value.email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) || value.email.length > 254)) errors.push("Adresse e-mail invalide.");
  if (value.phone.length > 20 || /[\r\n]/.test(value.phone)) errors.push("Téléphone : 20 caractères maximum, sur une seule ligne.");
  return errors;
}

export function validateColissimoRecipient(input: ColissimoRecipient) {
  const formatted = formatColissimoRecipient(input);
  const errors = colissimoRecipientErrors(formatted);
  if (errors.length) throw new ColissimoValidationError(errors.join(" "));
  return formatted;
}
