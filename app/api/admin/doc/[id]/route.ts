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
  let bytes: Buffer;
  try {
    bytes = await readFile(join(process.cwd(), "assets", "admin-docs", document.filename));
  } catch {
    return new Response("Document indisponible.", { status: 404, headers });
  }
  const disposition = new URL(request.url).searchParams.get("download") === "1" ? "attachment" : "inline";
  return new Response(new Uint8Array(bytes), {
    headers: { ...headers, "Content-Type": "image/jpeg", "Content-Disposition": `${disposition}; filename="${document.filename}"` },
  });
}
