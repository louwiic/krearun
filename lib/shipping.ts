export interface ShippingRateBracket {
  label: string;
  maxGrams: number;
  priceCents: number;
}

// La Poste — Lettre Services Plus (suivi inclus), grille fournie en septembre 2026.
// Elle reste modifiable depuis l'administration.
export const DEFAULT_REUNION_SHIPPING_RATES: ShippingRateBracket[] = [
  { label: "Jusqu'à 20 g", maxGrams: 20, priceCents: 341 },
  { label: "De 21 à 100 g", maxGrams: 100, priceCents: 445 },
  { label: "De 101 à 250 g", maxGrams: 250, priceCents: 577 },
  { label: "De 251 à 500 g", maxGrams: 500, priceCents: 804 },
  { label: "De 501 g à 1 kg", maxGrams: 1000, priceCents: 1023 },
  { label: "De 1,001 à 2 kg", maxGrams: 2000, priceCents: 1195 },
];

export function parseShippingRates(raw?: string | null): ShippingRateBracket[] {
  if (!raw) return DEFAULT_REUNION_SHIPPING_RATES;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_REUNION_SHIPPING_RATES;
    const rates = parsed
      .map((item) => ({
        label: String(item.label ?? "").trim(),
        maxGrams: Math.max(1, Number(item.maxGrams) || 0),
        priceCents: Math.max(0, Number(item.priceCents) || 0),
      }))
      .filter((item) => item.label && item.maxGrams > 0)
      .sort((a, b) => a.maxGrams - b.maxGrams);
    return rates.length > 0 ? rates : DEFAULT_REUNION_SHIPPING_RATES;
  } catch {
    return DEFAULT_REUNION_SHIPPING_RATES;
  }
}

export function calculateShippingCents(
  totalWeightGrams: number,
  rates: ShippingRateBracket[]
) {
  const weight = Math.max(1, Math.ceil(totalWeightGrams));
  const sortedRates = [...rates].sort((a, b) => a.maxGrams - b.maxGrams);
  const largestBracket = sortedRates[sortedRates.length - 1];

  if (!largestBracket) {
    return { label: "Envoi suivi", priceCents: 0 };
  }

  // La Lettre Services Plus est limitée à 2 kg. Si le panier dépasse cette
  // limite, le tarif est calculé sur plusieurs envois afin de ne jamais
  // sous-facturer un panier lourd avec le seul tarif 2 kg.
  const fullShipments = Math.floor(weight / largestBracket.maxGrams);
  const remainingWeight = weight % largestBracket.maxGrams;
  const shipmentCount = fullShipments + (remainingWeight > 0 ? 1 : 0);

  if (shipmentCount > 1) {
    const remainderBracket = remainingWeight
      ? sortedRates.find((rate) => remainingWeight <= rate.maxGrams) ?? largestBracket
      : null;
    return {
      label: `${shipmentCount} envois suivis`,
      priceCents:
        fullShipments * largestBracket.priceCents + (remainderBracket?.priceCents ?? 0),
    };
  }

  const bracket = sortedRates.find((rate) => weight <= rate.maxGrams) ?? largestBracket;
  return {
    label: bracket.label,
    priceCents: bracket.priceCents,
  };
}

export function formatWeight(grams: number) {
  if (grams >= 1000) return `${(grams / 1000).toFixed(2).replace(".", ",")} kg`;
  return `${Math.max(0, Math.round(grams))} g`;
}
