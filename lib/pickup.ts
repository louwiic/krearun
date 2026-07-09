export interface PickupPoint {
  id: string;
  name: string;
  address: string;
  schedule: string;
  note: string;
  active: boolean;
}

export const DEFAULT_PICKUP_POINTS: PickupPoint[] = [
  {
    id: "atelier-weekend",
    name: "Retrait atelier",
    address: "Adresse communiquée après validation",
    schedule: "Samedi et dimanche, sur rendez-vous",
    note: "Créneaux confirmés par message après la commande.",
    active: true,
  },
];

export function parsePickupPoints(raw?: string | null): PickupPoint[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        id: String(item.id ?? "").trim(),
        name: String(item.name ?? "").trim(),
        address: String(item.address ?? "").trim(),
        schedule: String(item.schedule ?? "").trim(),
        note: String(item.note ?? "").trim(),
        active: Boolean(item.active),
      }))
      .filter((item) => item.id && item.name && item.active);
  } catch {
    return [];
  }
}

export function getPickupPoint(raw: string | null | undefined, id: string) {
  return parsePickupPoints(raw).find((point) => point.id === id) ?? null;
}
