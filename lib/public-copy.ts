export function publicProductCopy(value: string): string {
  return value
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
