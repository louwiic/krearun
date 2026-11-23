export const CLAW_DRINK_HOLDER_NAME = "Porte-boisson personnalisé Griffe";
export const BULL_DRINK_HOLDER_NAME = "Porte-boisson Taureau";

export function publicProductName(slug: string, name: string): string {
  if (slug === "porte-canette-monster") return CLAW_DRINK_HOLDER_NAME;
  if (slug === "porte-canette-red-bull") return BULL_DRINK_HOLDER_NAME;
  return publicProductReferences(name);
}

export function withPublicProductName<T extends { slug: string; name: string }>(product: T): T {
  const name = publicProductName(product.slug, product.name);
  return name === product.name ? product : { ...product, name };
}

export function publicProductReferences(value: string): string {
  return value
    .replace(/\bporte[- ]boissons?\s+sweat\s+monster\b/gi, "Porte-boisson à capuche")
    .replace(/\bporte[- ](?:canettes?|boissons?)\s+monster\b/gi, CLAW_DRINK_HOLDER_NAME)
    .replace(/\bporte[- ](?:canettes?|boissons?)\s+red\s*[- ]?bull\b/gi, BULL_DRINK_HOLDER_NAME)
    .replace(/\bcanettes fines de type red\s*[- ]?bull\b|\bcanettes fines type red\s*[- ]?bull\b/gi, "canettes fines")
    .replace(/\bcanette red\s*[- ]?bull\b/gi, "canette fine")
    .replace(/\bnoir monster\b/gi, "Noir profond");
}

export function publicProductCopy(value: string): string {
  return publicProductReferences(value)
    .replace(/\bPLA\s+/gi, "")
    .replace(/\bPLA\b/gi, "matière")
    .replace(/impression\s+3D/gi, "fabrication")
    .replace(/\bimprimantes?\b/gi, "atelier")
    .replace(/\bimprim([ée])(e?)(s?)(?:\s+en\s+3D)?(?![a-zà-ÿ])/gi, (_, accent, feminine, plural) =>
      `fabriqu${accent}${feminine}${plural}`)
    .replace(/filaments?/gi, "matières")
    .replace(/couche par couche/gi, "avec soin")
    .replace(/lignes d'impression/gi, "fines lignes")
    .replace(/ligne d'impression/gi, "fine ligne");
}
