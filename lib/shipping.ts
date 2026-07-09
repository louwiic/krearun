export interface ShippingRateBracket {
  label: string;
  maxGrams: number;
  priceCents: number;
}

// Defaults for a small local Réunion shipping grid. Keep editable in admin.
export const DEFAULT_REUNION_SHIPPING_RATES: ShippingRateBracket[] = [
  { label: "0 - 250 g", maxGrams: 250, priceCents: 525 },
  { label: "250 - 500 g", maxGrams: 500, priceCents: 735 },
  { label: "500 - 750 g", maxGrams: 750, priceCents: 865 },
  { label: "750 g - 1 kg", maxGrams: 1000, priceCents: 940 },
  { label: "1 - 2 kg", maxGrams: 2000, priceCents: 1070 },
  { label: "2 - 5 kg", maxGrams: 5000, priceCents: 1660 },
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
  const bracket = rates.find((rate) => weight <= rate.maxGrams) ?? rates[rates.length - 1];
  return {
    label: bracket?.label ?? "Envoi suivi",
    priceCents: bracket?.priceCents ?? 0,
  };
}

export function formatWeight(grams: number) {
  if (grams >= 1000) return `${(grams / 1000).toFixed(2).replace(".", ",")} kg`;
  return `${Math.max(0, Math.round(grams))} g`;
}
