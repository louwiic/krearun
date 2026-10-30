import { isAdmin } from "@/lib/auth";
import { addProductPrintFile } from "@/lib/store";
import { MAX_PRINT_FILE_BYTES } from "@/lib/print-files";
import { holderSiteUrl } from "@/lib/custom-holder-http";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
export async function POST(request: Request) {
  if (!await isAdmin()) return Response.json({ error: "Accès réservé à l’administration." }, { status: 401, headers });
  if (![new URL(request.url).origin, holderSiteUrl(request)].includes(request.headers.get("origin") ?? "")) return Response.json({ error: "Origine refusée." }, { status: 403, headers });
  if (Number(request.headers.get("content-length")) > MAX_PRINT_FILE_BYTES + 65536) return Response.json({ error: "Fichier trop volumineux (100 Mo maximum)." }, { status: 413, headers });
  let form: FormData;
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Fichier manquant.");
    const chunks: Uint8Array[] = []; let size = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_PRINT_FILE_BYTES + 65536) { await reader.cancel(); return Response.json({ error: "Fichier trop volumineux (100 Mo maximum)." }, { status: 413, headers }); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    form = await new Request(request.url, { method: "POST", headers: { "Content-Type": request.headers.get("content-type") ?? "" }, body: bytes }).formData();
  } catch { return Response.json({ error: "L’envoi du fichier est incomplet. Réessaie." }, { status: 400, headers }); }
  const file = form.get("file");
  const productId = String(form.get("productId") ?? "");
  if (!(file instanceof File) || !/^[a-z0-9]{15}$/.test(productId) || file.size > MAX_PRINT_FILE_BYTES) return Response.json({ error: "Produit ou fichier invalide (100 Mo maximum)." }, { status: 400, headers });
  try {
    await addProductPrintFile(productId, file.name, Buffer.from(await file.arrayBuffer()), String(form.get("notes") ?? ""));
    return Response.json({ ok: true }, { headers });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "L’enregistrement a échoué." }, { status: 400, headers }); }
}
