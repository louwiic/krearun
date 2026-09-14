import { parseLetterEvent } from "@/lib/letter-events";
import { recordLetterEvent } from "@/lib/store";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get("sec-fetch-site") === "cross-site") {
    return Response.json({ error: "Origine refusée." }, { status: 403 });
  }
  let value: unknown;
  try {
    const text = await request.text();
    if (text.length > 1024) return Response.json({ error: "Requête trop volumineuse." }, { status: 413 });
    value = JSON.parse(text);
  } catch { return Response.json({ error: "JSON invalide." }, { status: 400 }); }
  const event = parseLetterEvent(value);
  if (!event) return Response.json({ error: "Événement invalide." }, { status: 400 });
  try {
    await recordLetterEvent(event);
    return Response.json({ ok: true }, { status: 202 });
  } catch {
    console.error("[Letter stats] Event persistence unavailable");
    return Response.json({ error: "Statistiques indisponibles." }, { status: 503 });
  }
}
