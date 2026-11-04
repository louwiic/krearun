import { isAdmin } from "@/lib/auth";
import { holderSiteUrl } from "@/lib/custom-holder-http";
import { boundedBody, assistantConfig } from "@/lib/assistant";
import { AssistantError, assistantOverview, enqueueAssistant, processAssistantRun, confirmAssistantAction } from "@/lib/assistant-server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const maxDuration = 120;
const headers = { "Cache-Control": "private, no-store" };
export async function POST(request: Request) {
  if (!await isAdmin()) return Response.json({ error: "Accès réservé à l’administration." }, { status: 401, headers });
  if (![new URL(request.url).origin, holderSiteUrl(request)].includes(request.headers.get("origin") || "")) return Response.json({ error: "Origine refusée." }, { status: 403, headers });
  try {
    const body = JSON.parse(await boundedBody(request, 6000));
    if (typeof body.conversationId !== "string" || !/^[a-f0-9-]{36}$/.test(body.conversationId)) throw new AssistantError("Conversation invalide.");
    const actor = `admin:${body.conversationId}`;
    let result;
    if (body.actionId) {
      if (!assistantConfig().enabled) throw new AssistantError("Assistant désactivé.");
      result = await confirmAssistantAction(actor, body.actionId, body.cancel === true);
      revalidatePath("/", "layout");
    } else {
      if (!assistantConfig().enabled || !assistantConfig().openaiReady) throw new AssistantError("Configure la clé OpenAI côté serveur et active l’assistant.");
      if (typeof body.requestId !== "string" || !/^[a-f0-9-]{36}$/.test(body.requestId)) throw new AssistantError("Demande invalide.");
      const run = await enqueueAssistant(actor, "admin", `admin:${body.requestId}`, body.message);
      result = await processAssistantRun(run);
    }
    return Response.json({ ...result, overview: await assistantOverview() }, { headers });
  } catch (error) {
    return Response.json({ error: error instanceof AssistantError ? error.message : "L’assistant est indisponible. Vérifie la configuration et les collections privées." }, { status: 400, headers });
  }
}
