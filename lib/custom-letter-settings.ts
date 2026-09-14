export const CUSTOM_LETTER_PRICE_CENTS = 2500;
export const LETTER_MANUFACTURING = Object.freeze({ thickness: 10, socketDepth: 2, clearance: 0.25 });

export type LetterConfiguration = {
  initial: string; name: string; height: number; nameWidth: number; position: number;
  baseColor: string; nameColor: string;
};

export function parseLetterConfiguration(value: unknown): LetterConfiguration | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const range = (key: string, min: number, max: number) => typeof v[key] === "number" && Number.isFinite(v[key]) && v[key] >= min && v[key] <= max;
  if (typeof v.initial !== "string" || !/^[A-Z]$/.test(v.initial) || typeof v.name !== "string") return null;
  const name = v.name.trim().normalize("NFC");
  if (!/^[\p{L}][\p{L}' -]{0,17}$/u.test(name)) return null;
  if (!range("height", 100, 220) || !range("nameWidth", 70, 145) || !range("position", 30, 70)) return null;
  if (typeof v.baseColor !== "string" || !/^#[0-9a-f]{6}$/i.test(v.baseColor) || typeof v.nameColor !== "string" || !/^#[0-9a-f]{6}$/i.test(v.nameColor)) return null;
  return { initial: v.initial, name, height: v.height as number, nameWidth: v.nameWidth as number, position: v.position as number, baseColor: v.baseColor, nameColor: v.nameColor };
}
