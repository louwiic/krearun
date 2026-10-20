import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isAdmin } from "@/lib/auth";
import { getAdminDocument } from "@/lib/admin-documents";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  if (!(await isAdmin())) return new Response("Accès réservé à l’admin.", { status: 401, headers });
  const document = getAdminDocument((await params).id);
  if (!document) return new Response("Document introuvable.", { status: 404, headers });
  const search = new URL(request.url).searchParams;
  const preview = search.get("preview") === "1" && search.get("download") !== "1" && Boolean(document.previewFilename);
  const filename = preview ? document.previewFilename! : document.filename;
  let bytes: Buffer;
  try {
    bytes = await readFile(join(process.cwd(), "assets", "admin-docs", filename));
  } catch {
    return new Response("Document indisponible.", { status: 404, headers });
  }
  const disposition = search.get("download") === "1" ? "attachment" : "inline";
  return new Response(new Uint8Array(bytes), {
    headers: { ...headers, "Content-Type": preview ? "image/jpeg" : document.contentType, "Content-Disposition": `${disposition}; filename="${filename}"` },
  });
}
