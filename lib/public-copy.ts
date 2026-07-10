export function publicProductCopy(value: string): string {
  return value
    .replace(/\bPLA\s+/gi, "")
    .replace(/\bPLA\b/gi, "matière")
    .replace(/impression\s+3D/gi, "fabrication")
    .replace(/imprim[ée]s?\s+en\s+3D/gi, "fabriqués")
    .replace(/imprim[ée]e?\s+en\s+3D/gi, "fabriquée")
    .replace(/imprim[ée]s?/gi, "fabriqués")
    .replace(/imprimante(s)?/gi, "atelier")
    .replace(/filaments?/gi, "matières")
    .replace(/couche par couche/gi, "avec soin")
    .replace(/lignes d'impression/gi, "fines lignes")
    .replace(/ligne d'impression/gi, "fine ligne");
}
