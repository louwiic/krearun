// Stripe limits each metadata value to 500 characters. Keep complete custom
// instructions when several personalized products share the same basket.
export function packCheckoutItems(items: unknown[]): Record<string, string> {
  const characters = Array.from(JSON.stringify(items));
  const metadata: Record<string, string> = {};
  for (let offset = 0, index = 0; offset < characters.length; offset += 450, index++) {
    metadata[index === 0 ? "items" : `items_${index + 1}`] = characters.slice(offset, offset + 450).join("");
  }
  if (Object.keys(metadata).length > 25) throw new Error("Le panier contient trop de détails. Merci de le diviser en deux commandes.");
  return metadata;
}
export function readCheckoutItems(metadata: Record<string, string> | null | undefined): string {
  let raw = metadata?.items ?? "";
  for (let index = 2; metadata?.[`items_${index}`] !== undefined; index++) raw += metadata[`items_${index}`];
  return raw;
}
