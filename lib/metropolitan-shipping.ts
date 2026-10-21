import type { ShippingRateBracket } from "./shipping";

export const METROPOLITAN_SOURCE = "https://www.colissimo.entreprise.laposte.fr/offres-et-services/tarifs-generaux/tarifs-colissimo-domicile-au-depart-des-dom";
export interface MetropolitanShippingGrid {
  version: string;
  effectiveFrom: string;
  source: string;
  rates: ShippingRateBracket[];
}
// Montants de livraison client validés le 21/10/2026 : reprise de la base
// transporteur HT sans signature, sans majoration ni conversion fiscale supposée.
export const DEFAULT_METROPOLITAN_SHIPPING: MetropolitanShippingGrid = {
  version: "RE-FR-sans-signature-2026-10-21", effectiveFrom: "2026-01-01", source: METROPOLITAN_SOURCE,
  rates: [
    [500,1086],[1000,1646],[2000,2243],[3000,2841],[4000,3439],
    [5000,3861],[6000,4637],[7000,5232],[8000,5696],[9000,6264],
    [10000,6945],[15000,9731],[20000,12522],[25000,15665],[30000,18929],
  ].map(([maxGrams,priceCents])=>({maxGrams,priceCents,label:`Jusqu’à ${maxGrams / 1000} kg`})),
};
export function parseMetropolitanShipping(raw?: string | null): MetropolitanShippingGrid {
  if (!raw?.trim()) return DEFAULT_METROPOLITAN_SHIPPING;
  const value = JSON.parse(raw) as MetropolitanShippingGrid;
  if (!value || typeof value.version !== "string" || !value.version.trim() || value.version.length > 100 || !/^\d{4}-\d{2}-\d{2}$/.test(value.effectiveFrom) || typeof value.source !== "string" || !value.source.startsWith("https://") || value.source.length > 500 || !Array.isArray(value.rates) || !value.rates.length) throw new Error("Grille métropole invalide.");
  const rates = value.rates.map(rate => {
    if (!rate || !Number.isSafeInteger(rate.maxGrams) || rate.maxGrams <= 0 || rate.maxGrams > 30000 || !Number.isSafeInteger(rate.priceCents) || rate.priceCents < 0 || rate.priceCents > 1000000 || typeof rate.label !== "string" || !rate.label.trim()) throw new Error("Tranche métropole invalide : poids entiers de 1 à 30 000 g et prix en centimes requis.");
    return {maxGrams:rate.maxGrams,priceCents:rate.priceCents,label:rate.label.trim().slice(0,100)};
  }).sort((a,b)=>a.maxGrams-b.maxGrams);
  if (new Set(rates.map(rate=>rate.maxGrams)).size !== rates.length || rates.at(-1)?.maxGrams !== 30000) throw new Error("La grille métropole doit avoir des bornes distinctes et se terminer à 30 000 g.");
  return {version:value.version.trim(),effectiveFrom:value.effectiveFrom,source:value.source,rates};
}
export function shippingZone(country: string, postalCode = ""): "RE" | "FR_METROPOLITAN" {
  const code=country.trim().toUpperCase(), postal=postalCode.trim();
  if (code === "RE") {
    if (postal && !/^974\d{2}$/.test(postal)) throw new Error("Pour La Réunion, indiquez un code postal 974xx ou choisissez France métropolitaine.");
    return "RE";
  }
  if (code !== "FR") throw new Error("La livraison est proposée à La Réunion et en France métropolitaine uniquement.");
  if (/^974\d{2}$/.test(postal)) return "RE";
  if (postal && (!/^\d{5}$/.test(postal) || /^(00|9[6-9])/.test(postal))) throw new Error("Ce code postal ne relève pas de la France métropolitaine. Contactez-nous pour cette destination.");
  return "FR_METROPOLITAN";
}
export interface MetropolitanQuote {
  zone: "FR_METROPOLITAN"; origin: "RE"; mode: "without_signature";
  gridVersion: string; source: string; effectiveFrom: string;
  weightGrams: number; physicalWeightGrams: number; baseCents: number;
  supplements: {label: string; cents: number}[]; priceCents: number;
  label: string; freeShipping: boolean;
}
export function metropolitanQuote(weightGrams: number, physicalWeightGrams: number, missingWeight: boolean, freeShipping: boolean, grid: MetropolitanShippingGrid): MetropolitanQuote {
  if (!Number.isFinite(physicalWeightGrams) || physicalWeightGrams < 0 || physicalWeightGrams > 30000 || weightGrams > 30000) throw new Error("Au-delà de 30 kg, contactez-nous pour organiser votre envoi en métropole.");
  if (missingWeight) throw new Error("Le poids emballé d’un article est manquant. Contactez-nous pour calculer l’envoi en métropole.");
  const weight=Math.ceil(weightGrams);
  const bracket=grid.rates.find(rate=>weight<=rate.maxGrams);
  if (!Number.isFinite(weight) || weight < 0 || (weight > 0 && !bracket)) throw new Error("Poids d’envoi invalide.");
  const baseCents=weight === 0 ? 0 : bracket!.priceCents;
  return {zone:"FR_METROPOLITAN",origin:"RE",mode:"without_signature",gridVersion:grid.version,source:grid.source,effectiveFrom:grid.effectiveFrom,weightGrams:weight,physicalWeightGrams:Math.ceil(physicalWeightGrams),baseCents,supplements:[],priceCents:freeShipping || weight === 0 ? 0 : baseCents,label:"Colissimo Réunion → métropole · sans signature",freeShipping:freeShipping || weight === 0};
}

export function shippingQuoteMetadata(quote: MetropolitanQuote): Record<string,string> {
  const raw=JSON.stringify(quote), result: Record<string,string>={};
  for(let offset=0,index=1;offset<raw.length;offset+=450,index++) result[index===1?"shippingQuote":`shippingQuote${index}`]=raw.slice(offset,offset+450);
  return result;
}
export function readShippingQuote(metadata: Record<string,string> | null | undefined): MetropolitanQuote | undefined {
  let raw=metadata?.shippingQuote || "";
  if (!raw) return undefined;
  for(let index=2;index<=4;index++) raw+=metadata?.[`shippingQuote${index}`] || "";
  try {const quote=JSON.parse(raw) as MetropolitanQuote;return quote.zone==="FR_METROPOLITAN" && quote.mode==="without_signature" && Number.isSafeInteger(quote.priceCents) && quote.priceCents>=0 ? quote : undefined;} catch {return undefined;}
}
