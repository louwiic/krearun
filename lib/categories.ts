import { CATEGORIES, type Category } from "./types";

export interface StoreCategory {
  value: Category;
  label: string;
  active: boolean;
}

export const DEFAULT_STORE_CATEGORIES: StoreCategory[] = CATEGORIES.map((category) => ({
  ...category,
  active: true,
}));

export function parseStoreCategories(raw: string): StoreCategory[] {
  try {
    const parsed = JSON.parse(raw) as Partial<StoreCategory>[];
    if (!Array.isArray(parsed)) return DEFAULT_STORE_CATEGORIES;

    return CATEGORIES.map((fallback) => {
      const saved = parsed.find((category) => category.value === fallback.value);
      return {
        value: fallback.value,
        label:
          typeof saved?.label === "string" && saved.label.trim()
            ? saved.label.trim().slice(0, 80)
            : fallback.label,
        active: saved?.active !== false,
      };
    });
  } catch {
    return DEFAULT_STORE_CATEGORIES;
  }
}

export function getVisibleCategories(raw: string): StoreCategory[] {
  return parseStoreCategories(raw).filter((category) => category.active);
}

/** Navigation families keep the existing category URLs and catalogue filters. */
export function groupStoreCategories(categories: StoreCategory[]) {
  const families = [
    { id: "maison", label: "Maison & décoration", values: ["veilleuses", "vases", "deco", "salle-de-bain"] },
    { id: "bureau", label: "Bureau & rangement", values: ["bureau", "rangement"] },
    { id: "accessoires", label: "Accessoires", values: ["porte-boisson", "lunette"] },
    { id: "collections", label: "Collections", values: ["noel"] },
  ];
  return families.map(family => ({ id: family.id, label: family.label, categories: categories.filter(category => category.active && family.values.includes(category.value)) })).filter(family => family.categories.length);
}
