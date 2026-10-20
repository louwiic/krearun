export const MONSTER_GIFT = "griffes";
export const MONSTER_GIFT_IMAGE = "/products/monster-porte-cles-griffes.webp";

/** Keep the labels of gifts in historical orders intact. */
export function monsterGiftLabel(value?: string, color?: string): string {
  if (!value) return "";
  if (value === MONSTER_GIFT) return `Porte-clés griffes${color ? ` — ${color}` : ""}`;
  if (value === "1" || value === "2") return `Choix ${value}`;
  return value;
}
