import { after } from "next/server";
import { assistantConfig, boundedBody, verifyWhatsAppSignature, extractWhatsAppMessages, whatsappAdmins } from "@/lib/assistant";
import { enqueueAssistant } from "@/lib/assistant-server";
import { processWhatsAppQueue } from "@/lib/assistant-whatsapp";

export const runtime = "nodejs";
export const maxDuration = 120;
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const token = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!token || params.get("hub.mode") !== "subscribe" || params.get("hub.verify_token") !== token) return new Response("Forbidden", { status: 403 });
  return new Response(params.get("hub.challenge") || "", { headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  const config = assistantConfig();
  if (!config.enabled || !config.whatsappReady || !config.openaiReady) return new Response("Unavailable", { status: 503 });
  let raw: string;
  try { raw = await boundedBody(request, 128000); } catch { return new Response("Invalid body", { status: 413 }); }
  if (!verifyWhatsAppSignature(raw, request.headers.get("x-hub-signature-256"), process.env.WHATSAPP_APP_SECRET || "")) return new Response("Forbidden", { status: 403 });
  try {
    const messages = extractWhatsAppMessages(JSON.parse(raw), process.env.WHATSAPP_PHONE_NUMBER_ID || "", whatsappAdmins());
    for (const m of messages.slice(0, 10)) await enqueueAssistant(`whatsapp:${m.from}`, "whatsapp", m.key, m.message);
    // A durable inbox is saved before acknowledging Meta. A minute cron drains it if this callback is interrupted.
    if (messages.length) after(async () => { try { await processWhatsAppQueue(); } catch { console.error("Assistant WhatsApp: traitement différé indisponible."); } });
    return Response.json({ ok: true });
  } catch { return new Response("Temporary storage failure", { status: 503 }); }
}
