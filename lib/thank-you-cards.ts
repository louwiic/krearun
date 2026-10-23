export type ThankYouModel = "merci" | "essence";
export type ThankYouTexts = { heading: string; message: string; code: string; offer: string; signature: string };
export type ThankYouDrafts = Record<ThankYouModel, ThankYouTexts>;
export type ThankYouRequest = { model: ThankYouModel; texts: ThankYouTexts; perPage: 4 | 8; quantity: number; cropMarks: boolean };

export const THANK_YOU_LINKS = [
  { label: "Notre boutique", url: "https://krearun.re/boutique" },
  { label: "Newsletter", url: "https://krearun.re/newsletter" },
  { label: "Laisser un avis", url: "https://krearun.re/avis" },
] as const;
export const THANK_YOU_QR_LAYOUT = { x: [140, 680, 1220], y: 800, size: 390, labelY: 1191, labelHeight: 40 } as const;

export const THANK_YOU_DEFAULTS: ThankYouDrafts = {
  merci: {
    heading: "Merci",
    message: "Merci pour ta commande et ton soutien ! Cela me motive à te proposer encore plus de choses.\nOn espère qu’elle te plaira autant qu’on a aimé la créer pour toi !",
    code: "CODE : THANKYOU",
    offer: "-10% sur ta prochaine commande !!",
    signature: "De la part de Loïc",
  },
  essence: {
    heading: "Pour pouvoir mieux\nconsommer\nl’essence",
    message: "",
    code: "CODE : THANKYOU",
    offer: "-10% sur ta prochaine commande !!",
    signature: "",
  },
};
export const THANK_YOU_LIMITS = { heading: 150, message: 450, code: 60, offer: 120, signature: 70 } as const;

export function parseThankYouRequest(value: unknown): ThankYouRequest {
  if (!value || typeof value !== "object") throw new Error("Choisissez un modèle de carte.");
  const input = value as Record<string, unknown>;
  if (input.model !== "merci" && input.model !== "essence") throw new Error("Modèle de carte inconnu.");
  if (!input.texts || typeof input.texts !== "object") throw new Error("Les textes de la carte sont manquants.");
  const texts = {} as ThankYouTexts;
  for (const [key, limit] of Object.entries(THANK_YOU_LIMITS)) {
    const text = (input.texts as Record<string, unknown>)[key];
    if (typeof text !== "string" || Array.from(text).length > limit || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(text)) throw new Error(`Le champ ${key} doit contenir au maximum ${limit} caractères.`);
    texts[key as keyof ThankYouTexts] = text.replace(/\r\n?/g, "\n").normalize("NFC").trim();
  }
  if (input.perPage !== 4 && input.perPage !== 8) throw new Error("Choisissez 4 ou 8 cartes par page A4.");
  if (!Number.isInteger(input.quantity) || (input.quantity as number) < 1 || (input.quantity as number) > 80) throw new Error("Choisissez entre 1 et 80 cartes.");
  if (typeof input.cropMarks !== "boolean") throw new Error("Vérifiez l’option des repères de découpe.");
  return { model: input.model, texts, perPage: input.perPage, quantity: input.quantity as number, cropMarks: input.cropMarks };
}

export function thankYouLayout(perPage: 4 | 8) {
  const pageWidth = perPage === 4 ? 297 : 210;
  const pageHeight = perPage === 4 ? 210 : 297;
  const columns = 2, rows = perPage / columns, gap = 4, margin = 8;
  const ratio = 1748 / 1240;
  const width = Math.min((pageWidth - margin * 2 - gap) / columns, (pageHeight - margin * 2 - gap * (rows - 1)) / rows * ratio);
  const height = width / ratio;
  return {
    pageWidth, pageHeight, columns, rows, gap, width, height,
    left: (pageWidth - width * columns - gap * (columns - 1)) / 2,
    top: (pageHeight - height * rows - gap * (rows - 1)) / 2,
  };
}
