import { parseMonsterColors } from "./monster-multicolor";
export const MONSTER_GIFT = "griffes";
export const MONSTER_GIFT_IMAGE = "/products/monster-porte-cles-griffes.webp";

/** Keep the labels of gifts in historical orders intact. */
export function monsterGiftLabel(value?: string, color?: string): string {
  if (!value) return "";
  if (value === MONSTER_GIFT) {
    const giftColor=parseMonsterColors(color)?.claws || color;
    return `Porte-clés griffes${giftColor ? ` — ${giftColor}` : ""}`;
  }
  if (value === "1" || value === "2") return `Choix ${value}`;
  return value;
}
