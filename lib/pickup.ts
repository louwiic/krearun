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
    id: "saint-pierre-mon-caprice",
    name: "Saint-Pierre Mon Caprice",
    address: "Saint-Pierre, quartier Mon Caprice",
    schedule: "Samedi et dimanche, sur rendez-vous",
    note: "Créneau confirmé par message après la commande.",
    active: true,
  },
  {
    id: "saint-leu-portail",
    name: "Saint-Leu Portail",
    address: "Saint-Leu, secteur Portail",
    schedule: "Samedi et dimanche, sur rendez-vous",
    note: "Créneau confirmé par message après la commande.",
    active: true,
  },
  {
    id: "le-port-sacre-coeur",
    name: "Le Port Sacré Cœur",
    address: "Le Port, secteur Sacré Cœur",
    schedule: "Samedi et dimanche, sur rendez-vous",
    note: "Créneau confirmé par message après la commande.",
    active: true,
  },
];

export function parsePickupPoints(
  raw?: string | null,
  opts?: { includeInactive?: boolean }
): PickupPoint[] {
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
      .filter((item) => item.id && item.name && (opts?.includeInactive || item.active));
  } catch {
    return [];
  }
}

export function getPickupPoint(raw: string | null | undefined, id: string) {
  return parsePickupPoints(raw).find((point) => point.id === id) ?? null;
}
