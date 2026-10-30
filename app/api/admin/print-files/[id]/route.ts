import { isAdmin } from "@/lib/auth";
import { downloadProductPrintFile } from "@/lib/store";
import { printFileDisposition } from "@/lib/print-files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdmin()) return new Response("Accès réservé à l’administration.", { status: 401, headers });
  const { id } = await params;
  try {
    const result = await downloadProductPrintFile(id);
    if (!result) return new Response("Fichier introuvable.", { status: 404, headers });
    return new Response(result.response.body, { headers: { ...headers,
      "Content-Type": "application/vnd.ms-package.3dmanufacturing-3dmodel+xml",
      "Content-Disposition": printFileDisposition(result.record.originalName),
      "Content-Length": String(result.record.sizeBytes),
    } });
  } catch { return new Response("Téléchargement indisponible. Réessaie.", { status: 503, headers }); }
}
