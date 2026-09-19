import { isAdmin } from "@/lib/auth";
import { getColissimoShipment } from "@/lib/store";
import type { ColissimoDocuments } from "@/lib/colissimo-response";

export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; document: string }> }) {
  if (!(await isAdmin())) return new Response("Non autorisé", { status: 401 });
  const { id, document } = await params;
  if (!/^[a-z0-9]{15}$/.test(id) || !["label", "cn23", "proforma"].includes(document)) return new Response("Introuvable", { status: 404 });
  try {
    const shipment = await getColissimoShipment(id);
    const content = shipment?.documents?.[document as keyof ColissimoDocuments];
    if (!content) return new Response("Document indisponible", { status: 404 });
    return new Response(Buffer.from(content, "base64"), { headers: {
      "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="colissimo-${id}-${document}.pdf"`,
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    } });
  } catch { return new Response("Stockage indisponible", { status: 503 }); }
}
