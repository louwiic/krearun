import { timingSafeEqual } from "node:crypto";
import { assistantPrune } from "@/lib/assistant-server";
import { processWhatsAppQueue } from "@/lib/assistant-whatsapp";

export const runtime = "nodejs";
export const maxDuration = 120;
export async function POST(request: Request) {
  const secret = process.env.ASSISTANT_WORKER_SECRET;
  const supplied = request.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  if (!secret || Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return new Response("Forbidden", { status: 403 });
  try {
    await processWhatsAppQueue();
    await assistantPrune();
    const { processCartReminders } = await import("@/lib/cart-reminder-service");
    await processCartReminders();
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Traitement indisponible." }, { status: 503 }); }
}
