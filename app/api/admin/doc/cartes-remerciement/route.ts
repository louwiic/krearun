import { isAdmin } from "@/lib/auth";
import { parseThankYouRequest } from "@/lib/thank-you-cards";
import { generateThankYouCardsPdf, renderThankYouCardSvg } from "@/lib/thank-you-cards-render";

export const runtime = "nodejs";
const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Accès réservé à l’admin." }, { status: 401, headers: privateHeaders });
  if (Number(request.headers.get("content-length") || 0) > 12_000) return Response.json({ error: "Textes trop longs." }, { status: 413, headers: privateHeaders });
  try {
    const body = await request.text();
    if (body.length > 12_000) return Response.json({ error: "Textes trop longs." }, { status: 413, headers: privateHeaders });
    const raw = JSON.parse(body);
    const input = parseThankYouRequest(raw);
    if (raw.format === "preview") return new Response(await renderThankYouCardSvg(input), {
      headers: { ...privateHeaders, "Content-Type": "image/svg+xml", "Content-Security-Policy": "default-src 'none'; img-src data:; style-src 'none'; sandbox" },
    });
    if (raw.format !== "pdf") throw new Error("Choisissez un aperçu ou un export PDF.");
    return new Response(new Uint8Array(await generateThankYouCardsPdf(input)), {
      headers: { ...privateHeaders, "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="krearun-cartes-${input.model}-a4.pdf"` },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "L’export est indisponible." }, { status: 400, headers: privateHeaders });
  }
}
