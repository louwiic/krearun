interface AdminDocument {
  id: string;
  title: string;
  description: string;
  filename: string;
  originalFilename: string;
  contentType: string;
  previewFilename?: string;
  previewContentType?: string;
}
export const ADMIN_DOCUMENTS: readonly AdminDocument[] = [
  {
    id: "cartes-remerciement-originales",
    title: "Cartes de remerciement · archive originale",
    description: "Les deux visuels d’origine. Personnalisez leurs textes et exportez vos planches A4 dans l’éditeur ci-dessus.",
    filename: "cartes-remerciement-originales.zip",
    originalFilename: "MERCI !.zip",
    contentType: "application/zip",
    previewFilename: "carte-merci-1.png",
    previewContentType: "image/png",
  },
  {
    id: "carte-merci-1", title: "Carte Merci · original", description: "Modèle de remerciement avec fleur bleue et signature.",
    filename: "carte-merci-1.png", originalFilename: "MERCI !.zip / 1.png", contentType: "image/png",
  },
  {
    id: "carte-merci-2", title: "Carte Essence · original", description: "Modèle avec texte orange et motif cadeau.",
    filename: "carte-merci-2.png", originalFilename: "MERCI !.zip / 2.png", contentType: "image/png",
  },
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
