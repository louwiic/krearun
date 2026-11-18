/** One gift pair per paid GTA order, regardless of quantity. Checked again on the server. */
export const GTA_GIFT_OFFER = "gta_keychain_and_name_v1";
export const GTA_GIFT_SLUG = "porte-cles-gta-vi-palmiers";
export const GTA_GIFT_IMAGE = "/products/gta-6/porte-cles-palmiers.webp";
export const GTA_GIFT_NAME = "Porte-clés GTA VI · Palmiers";
export function qualifiesForGtaGift(product: { slug: string; priceCents: number }) {
  return product.priceCents > 0 && (product.slug.startsWith("porte-cles-gta-vi-") || product.slug === "porte-boisson-gta-vi" || product.slug === "lampe-gta-vi");
}
export function gtaGiftOrderItems(name: string) {
  return [
    { productId: "gta-offer-keychain", name: `${GTA_GIFT_NAME} — offert`, priceCents: 0, quantity: 1, color: "Rose et bleu", image: GTA_GIFT_IMAGE },
    ...(name ? [{ productId: "gta-offer-name", name: "Porte-clés prénom · police GTA — offert", priceCents: 0, quantity: 1, customName: `${name} · Police GTA`, color: "", image: "/offers/porte-cles-prenom.png" }] : []),
  ];
}
