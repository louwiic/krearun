export const ADMIN_DOCUMENTS = [
  {
    id: "tarifs-colissimo-outre-mer-2026",
    title: "Tarifs Colissimo Outre-mer 2026",
    description: "Tableau des tarifs au départ de la France métropolitaine, zones OM 1 et OM 2.",
    filename: "tarifs-colissimo-outre-mer-2026.jpeg",
    originalFilename: "WhatsApp Image 2026-10-16 at 15.48.41.jpeg",
  },
  {
    id: "guide-envoi-peibox",
    title: "Guide d’envoi Peibox",
    description: "Étapes d’envoi, points relais, coordonnées de réception et frais complémentaires.",
    filename: "guide-envoi-peibox.jpeg",
    originalFilename: "WhatsApp Image 2026-10-16 at 16.04.35 (1).jpeg",
  },
] as const;

export function getAdminDocument(id: string) {
  return ADMIN_DOCUMENTS.find((document) => document.id === id);
}
