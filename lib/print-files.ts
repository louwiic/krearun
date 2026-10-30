import { unzipSync } from "fflate";

export const MAX_PRINT_FILE_BYTES = 100 * 1024 * 1024;
export type ProductPrintFile = {
  id: string;
  productId: string;
  file: string;
  originalName: string;
  sha256: string;
  sizeBytes: number;
  notes: string;
  sourceUrl: string;
};

// Inspect the ZIP directory without inflating the potentially large model data.
export function validatePrintFile(name: string, bytes: Uint8Array) {
  if (!/\.3mf$/i.test(name)) throw new Error("Choisis un fichier .3mf.");
  if (!bytes.length || bytes.length > MAX_PRINT_FILE_BYTES) throw new Error("Le fichier doit peser entre 1 octet et 100 Mo.");
  let contentTypes = false;
  let model = false;
  let total = 0;
  try {
    unzipSync(bytes, { filter(entry) {
      total += entry.originalSize;
      if (entry.name === "[Content_Types].xml") contentTypes = true;
      if (/^3D\/.+\.model$/i.test(entry.name)) model = true;
      return false;
    } });
  } catch { throw new Error("Le fichier 3MF est illisible ou incomplet."); }
  if (!contentTypes || !model || total > 1024 * 1024 * 1024) throw new Error("Ce fichier n’est pas un projet 3MF valide (1 Go décompressé maximum).");
}

export function printFileDisposition(name: string) {
  const clean = name.replace(/[\r\n\x00-\x1f\x7f]/g, "").slice(0, 240) || "projet.3mf";
  return `attachment; filename="projet.3mf"; filename*=UTF-8''${encodeURIComponent(clean).replace(/['()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)}`;
}
