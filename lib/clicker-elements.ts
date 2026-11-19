import source from "../public/models/clicker/elements.json";
import type { NameplateContour } from "./nameplate-3d";
export type ClickerElement = { id: string; value: string; label: string; group: string; sourceName: string; contours: NameplateContour[]; boundsMm: number[] };
export const CLICKER_ELEMENTS = source.elements as ClickerElement[];
export const CLICKER_ELEMENT_GROUPS = ["Symboles", "Alphabet", "Chiffres", "Lettres accentuées", "Ponctuation", "Vierge"];
const byValue = new Map(CLICKER_ELEMENTS.map(item => [item.value,item]));
export function clickerElement(value: string) { return byValue.get(value.normalize("NFC").toUpperCase()); }
export function clickerCharacters(text: string) { return Array.from(text.normalize("NFC").toUpperCase()); }
export function printableClickerText(text: string) { return clickerCharacters(text).filter(char => char === " " || clickerElement(char)).join(""); }
