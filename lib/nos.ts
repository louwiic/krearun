export const NOS_SLUG = "porte-boisson-nos-500ml";
export const NOS_TEXT_MAX = 60;
export const NOS_COLORS = [
  { name: "Noir", hex: "#171717" },
  { name: "Rose", hex: "#e66a9c" },
  { name: "Blanc", hex: "#ffffff" },
];

export function nosLogoId(value: string | undefined): string | null {
  return /^Logo : ([a-z0-9]{15})$/.exec(value || "")?.[1] ?? null;
}
export function personalizationLabel(value: string | undefined): string {
  return nosLogoId(value) ? "Logo fourni" : value || "";
}
