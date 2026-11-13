// Personnages prédéfinis de la boutique en temps réel : tenue, peau, casquette.
// Partagé entre le serveur (validation), la scène 3D (meshes) et le sélecteur
// (aperçus CSS). Jamais de contenu libre : uniquement ces combinaisons.
export const LIVE_AVATARS = [
  { outfit: 0xff6b35, skin: 0xf1c7a8, hat: 0x171717 },
  { outfit: 0x2a9d8f, skin: 0xd9a06b, hat: 0xf6f3ee },
  { outfit: 0x457b9d, skin: 0x8d5a3b, hat: 0xe9c46a },
  { outfit: 0xe9c46a, skin: 0xc68642, hat: 0x457b9d },
  { outfit: 0x6d597a, skin: 0xf1c7a8, hat: 0xff6b35 },
  { outfit: 0x588157, skin: 0x8d5a3b, hat: 0x171717 },
  { outfit: 0xe76f51, skin: 0xd9a06b, hat: 0x2a9d8f },
  { outfit: 0x2b2824, skin: 0xc68642, hat: 0xff6b35 },
];

export const LIVE_ACTIONS = ["assis", "wc"] as const;
export type LiveAction = (typeof LIVE_ACTIONS)[number];

// Zones que le client peut revendiquer pendant le parcours guidé.
export const LIVE_ZONES = ["entree", "rayons", "atelier", "caisse", "comptoir", "balcon"] as const;

export function cssColor(hex: number): string {
  return `#${hex.toString(16).padStart(6, "0")}`;
}
