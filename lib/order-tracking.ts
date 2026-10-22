export function normalizeOrderTrackingNumber(value: unknown): string {
  if (typeof value !== "string" || value.length > 500) {
    throw new Error("Numéro de suivi invalide.");
  }
  const tracking = value.replace(/\s+/gu, "").toUpperCase();
  if (tracking && !/^[A-Z0-9]{8,40}$/.test(tracking)) {
    throw new Error("Le numéro de suivi doit contenir entre 8 et 40 lettres ou chiffres. Collez uniquement le numéro du colis.");
  }
  return tracking;
}
