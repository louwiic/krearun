import { isAdmin } from "@/lib/admin";
import { randomUUID } from "node:crypto";
import { saveUsage } from "@/lib/ai-usage-store";
import {
  tokensFromResponse,
  estimateNanoUsd,
  PRICING_VERSION,
  type UsageEvent,
} from "@/lib/ai-usage";
import {
  OPENAI_PLAN_MODEL,
  parsePlanAnalysis,
  openAIPlanRequest,
} from "@/lib/plan-analysis";

export const maxDuration = 120;
let running = false;
let attempts: number[] = [];
export async function POST(request: Request) {
  const reply = (body: object, status = 200) =>
    Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
  if (!(await isAdmin()))
    return reply({ error: "Connexion admin requise." }, 401);
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return reply({ error: "Origine refusée." }, 403);
  const key = process.env.OPENAI_API_KEY;
  if (!key)
    return reply(
      {
        error:
          "Clé OpenAI absente. Renseigner OPENAI_API_KEY dans .env.local, puis relancer le serveur.",
      },
      503,
    );
  if (Number(request.headers.get("content-length")) > 7_000_000)
    return reply({ error: "Plan trop volumineux (5 Mo maximum)." }, 413);
  let image: string;
  try {
    const raw = await request.text();
    if (raw.length > 7_000_000)
      return reply({ error: "Plan trop volumineux." }, 413);
    const body = JSON.parse(raw);
    if (
      typeof body.image !== "string" ||
      !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(body.image)
    )
      return reply({ error: "Image JPG, PNG ou WebP requise." }, 400);
    image = body.image;
    if (Buffer.from(image.split(",")[1], "base64").length > 5_000_000)
      return reply({ error: "Plan trop volumineux." }, 413);
  } catch {
    return reply({ error: "Requête invalide." }, 400);
  }
  attempts = attempts.filter((t) => t > Date.now() - 3600_000);
  if (running || attempts.length >= 10)
    return reply(
      {
        error: running
          ? "Une analyse est déjà en cours."
          : "Limite de test atteinte : 10 analyses par heure.",
      },
      429,
    );
  running = true;
  attempts.push(Date.now());
  const event: UsageEvent = {
    id: randomUUID(),
    date: new Date().toISOString(),
    model: OPENAI_PLAN_MODEL,
    status: "pending",
    usage: null,
    costNanoUsd: null,
    pricing: PRICING_VERSION,
  };
  try {
    await saveUsage(event);
  } catch {
    running = false;
    return reply(
      { error: "Suivi des coûts indisponible. Analyse non lancée." },
      503,
    );
  }
  try {
    const model = OPENAI_PLAN_MODEL;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(openAIPlanRequest(image)),
      signal: AbortSignal.timeout(100_000),
    });
    if (!response.ok) {
      event.status = "rejected";
      if ([400, 401, 403, 404, 429].includes(response.status))
        event.costNanoUsd = 0;
      return reply(
        {
          error:
            response.status === 401 || response.status === 403
              ? "OpenAI refuse la clé ou l’accès au modèle."
              : response.status === 429
                ? "Quota OpenAI atteint. Vérifier les crédits et les limites du compte API."
                : "L’analyse OpenAI a échoué. Réessayer plus tard.",
        },
        502,
      );
    }
    const result = await response.json();
    event.status = "error";
    event.usage = tokensFromResponse(result.usage);
    event.costNanoUsd = event.usage ? estimateNanoUsd(event.usage) : null;
    const choice = result.choices?.[0];
    if (
      choice?.finish_reason !== "stop" ||
      typeof choice?.message?.content !== "string"
    )
      return reply(
        { error: "Réponse IA incomplète. Essayer un extrait du plan." },
        502,
      );
    const analysis = parsePlanAnalysis(JSON.parse(choice.message.content));
    event.status = "success";
    return reply({ analysis, model });
  } catch (error) {
    event.status = "error";
    return reply(
      {
        error:
          error instanceof Error && error.name === "TimeoutError"
            ? "Délai OpenAI dépassé. Réessayer avec un extrait du plan."
            : "Réponse IA inexploitable. Aucune donnée ajoutée.",
      },
      502,
    );
  } finally {
    try {
      await saveUsage(event);
    } catch {
      console.error("[AI usage] Finalisation du suivi impossible", event.id);
    }
    running = false;
  }
}
