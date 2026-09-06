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
