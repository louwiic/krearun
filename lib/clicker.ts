import type { Product } from "./types";

export const CLICKER_PRODUCT_ID = "clicker-studio";
export const CLICKER_PRICE_CENTS = 1200;

export const CLICKER_PRODUCT: Product = {
  id: CLICKER_PRODUCT_ID,
  name: "Clicker Studio personnalisé",
  slug: "clicker-studio",
  tagline: "Un clicker composé rien que pour vous",
  description: "Clicker personnalisé fabriqué à la commande.",
  priceCents: CLICKER_PRICE_CENTS,
  category: "deco",
  images: ["/images/clicker-studio-product.png"],
  videoUrl: "",
  weightGrams: 30,
  colors: [],
  stock: 999,
  featured: false,
  active: true,
  isNew: true,
  preorder: true,
  partnerShared: false,
  namePersonalizationEnabled: false,
  namePersonalizationPriceCents: 0,
  variants: [],
  quantityDiscounts: [],
  createdAt: "",
  updatedAt: "",
};
