interface AdminDocument {
  id: string;
  title: string;
  description: string;
  filename: string;
  originalFilename: string;
  contentType: string;
  previewFilename?: string;
}
export const ADMIN_DOCUMENTS: readonly AdminDocument[] = [
  {
    id: "charte-krearun",
    title: "Charte graphique Kréarun",
    description: "Direction Atelier pop · palette, typographies, logo et règles de mise en page. Octobre 2026 · 7 pages.",
    filename: "charte-krearun.pdf",
    originalFilename: "Charte_Krearun.pdf",
    contentType: "application/pdf",
    previewFilename: "charte-krearun-apercu.jpeg",
  },
  {
    id: "tarifs-colissimo-outre-mer-2026",
    title: "Tarifs Colissimo Outre-mer 2026",
    description: "Tableau des tarifs au départ de la France métropolitaine, zones OM 1 et OM 2.",
    filename: "tarifs-colissimo-outre-mer-2026.jpeg",
    originalFilename: "WhatsApp Image 2026-10-16 at 15.48.41.jpeg",
    contentType: "image/jpeg",
  },
  {
    id: "guide-envoi-peibox",
    title: "Guide d’envoi Peibox",
    description: "Étapes d’envoi, points relais, coordonnées de réception et frais complémentaires.",
    filename: "guide-envoi-peibox.jpeg",
    originalFilename: "WhatsApp Image 2026-10-16 at 16.04.35 (1).jpeg",
    contentType: "image/jpeg",
  },
] as const;

export function getAdminDocument(id: string) {
  return ADMIN_DOCUMENTS.find((document) => document.id === id);
}
