import type { Order } from "./types";

export const COLISSIMO_PRODUCTS = [
  { value: "DOM", label: "Domicile sans signature" },
  { value: "DOS", label: "Domicile avec signature" },
  { value: "COM", label: "Outre-mer sans signature" },
  { value: "CDS", label: "Outre-mer avec signature" },
  { value: "ECO", label: "Économique outre-mer" },
] as const;
export type ColissimoAddress = {
  companyName?: string; lastName?: string; line2: string; line3?: string;
  countryCode: string; city: string; zipCode: string; email?: string; phoneNumber?: string;
};
export type CustomsArticle = {
  description: string; quantity: number; weight: number; value: number; hsCode: string; originCountry: string;
};
export type ColissimoInput = {
  productCode: string; weight: number; depositDate: string; format: string;
  customs: boolean; articles: CustomsArticle[]; postage: number; invoiceNumber: string;
};
export type ShipmentSummary = {
  id: string; state: "generating" | "ready" | "uncertain";
  parcelNumber: string; productCode: string; created: string;
  documents: string[];
};
export class ColissimoValidationError extends Error {}
export function colissimoCountry(country: string, postalCode: string) {
  const normalized = country.trim().toUpperCase();
  if (["FR", "FRANCE", "RE", "RÉUNION", "REUNION", "LA RÉUNION"].includes(normalized) && /^974/.test(postalCode)) return "RE";
  if (["RÉUNION", "REUNION", "LA RÉUNION"].includes(normalized)) return "RE";
  if (normalized === "FR" || normalized === "FRANCE") {
    if (postalCode === "97133") return "BL";
    if (postalCode === "97150") return "MF";
    const territories: Record<string, string> = { "971": "GP", "972": "MQ", "973": "GF", "976": "YT" };
    return territories[postalCode.slice(0, 3)] || "FR";
  }
  return normalized;
}
function checkAddress(address: ColissimoAddress, label: string) {
  if (!(address.companyName || address.lastName) || !address.line2 || !address.city || !address.zipCode || !/^[A-Z]{2}$/.test(address.countryCode))
    throw new ColissimoValidationError(`Adresse ${label} incomplète : nom, rue, ville, code postal et pays ISO requis.`);
  for (const key of ["companyName", "lastName", "line2", "line3", "city"] as const) {
    if ((address[key]?.length || 0) > 35) throw new ColissimoValidationError(`Adresse ${label} : ${key} dépasse 35 caractères. Corrigez l’adresse avant l’envoi.`);
  }
}
export function buildColissimoRequest(order: Order, sender: ColissimoAddress, input: ColissimoInput, today: string) {
  if (["cancelled", "delivered", "shipped"].includes(order.status)) throw new ColissimoValidationError("Cette commande est annulée ou déjà expédiée.");
  if (order.trackingNumber) throw new ColissimoValidationError("Cette commande possède déjà un numéro de suivi. Vérifiez l’expédition existante.");
  if (!COLISSIMO_PRODUCTS.some((product) => product.value === input.productCode)) throw new ColissimoValidationError("Choisissez un service Colissimo.");
  if (!Number.isFinite(input.weight) || input.weight <= 0 || input.weight > 30) throw new ColissimoValidationError("Le poids du colis doit être compris entre 0 et 30 kg.");
  if (!["PDF_A4_300dpi", "PDF_10x15_300dpi"].includes(input.format)) throw new ColissimoValidationError("Format d’étiquette invalide.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.depositDate) || !Number.isFinite(Date.parse(input.depositDate)) || new Date(input.depositDate).toISOString().slice(0, 10) !== input.depositDate || input.depositDate < today)
    throw new ColissimoValidationError("Choisissez une date de dépôt valide, aujourd’hui ou plus tard.");
  const addressee: ColissimoAddress = {
    lastName: order.name.trim(), line2: order.addressLine1.trim(),
    ...(order.addressLine2.trim() ? { line3: order.addressLine2.trim() } : {}),
    countryCode: colissimoCountry(order.country, order.postalCode), city: order.city.trim(), zipCode: order.postalCode.trim(),
    ...(order.email ? { email: order.email } : {}), ...(order.phone ? { phoneNumber: order.phone } : {}),
  };
  checkAddress(sender, "expéditeur");
  checkAddress(addressee, "destinataire");
  // Require a declaration for cross-border shipments in this first integration.
  // Colissimo's validation remains authoritative for the selected route/contract.
  const customs = input.customs || sender.countryCode !== addressee.countryCode;
  if (customs) {
    if (!input.articles.length || input.articles.length > 100) throw new ColissimoValidationError("Renseignez les articles de la déclaration douanière.");
    for (const article of input.articles) {
      if (!article.description.trim() || article.description.length > 64 || !Number.isInteger(article.quantity) || article.quantity < 1 || !Number.isFinite(article.weight) || article.weight <= 0 || !Number.isFinite(article.value) || article.value <= 0 || !/^(\d{6}|\d{8}|\d{10})$/.test(article.hsCode) || !/^[A-Z]{2}$/.test(article.originCountry))
        throw new ColissimoValidationError("Chaque article douanier nécessite une description, quantité, poids unitaire, valeur unitaire, code douanier (6, 8 ou 10 chiffres) et pays d’origine ISO.");
    }
    if (input.articles.reduce((sum, article) => sum + article.weight * article.quantity, 0) > input.weight + 0.00001)
      throw new ColissimoValidationError("Le poids des articles dépasse celui du colis.");
    if (!Number.isFinite(input.postage) || input.postage < 0 || input.postage > 10000) throw new ColissimoValidationError("Frais de transport douaniers invalides.");
    if (!input.invoiceNumber.trim() || input.invoiceNumber.length > 35) throw new ColissimoValidationError("Renseignez la référence de la facture pour la douane (35 caractères maximum).");
  }
  return {
    outputFormat: { x: 0, y: 0, outputPrintingType: input.format },
    letter: {
      service: { productCode: input.productCode, depositDate: input.depositDate, orderNumber: `KR-${order.number}`, commercialName: "Krearun Studio",
        ...(customs ? { totalAmount: Math.round(input.postage * 100), transportationAmount: Math.round(input.postage * 100), returnTypeChoice: 2 } : {}) },
      parcel: { weight: input.weight },
      sender: { senderParcelRef: `KR-${order.number}`, address: sender },
      addressee: { addresseeParcelRef: `KR-${order.number}`, address: addressee },
      ...(customs ? { customsDeclarations: { includeCustomsDeclarations: 1, invoiceNumber: input.invoiceNumber,
        contents: { article: input.articles, category: { value: 3 } } } } : {}),
    },
  };
}
