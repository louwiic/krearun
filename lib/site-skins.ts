export const SITE_SKINS = [
  { id: "default", name: "Kréarun", description: "La charte habituelle de la boutique." },
  { id: "halloween", name: "Halloween", description: "Orange citrouille, prune et petits frissons à l’atelier." },
] as const;
export type SiteSkin = typeof SITE_SKINS[number]["id"];

export function isSiteSkin(value: unknown): value is SiteSkin {
  return SITE_SKINS.some(skin => skin.id === value);
}

export function activeSiteSkin(settings: { site_skin?: unknown; site_skin_enabled?: boolean }): SiteSkin {
  return settings.site_skin_enabled && isSiteSkin(settings.site_skin) ? settings.site_skin : "default";
}
