import { createHash } from "node:crypto";
import { requestCartReminder } from "@/lib/cart-reminder-service";
import { siteOrigin } from "@/lib/seo";
const buckets = new Map<string, { count: number; until: number }>();
export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  if (![new URL(request.url).origin, siteOrigin()].includes(request.headers.get("origin") || "") || request.headers.get("sec-fetch-site") === "cross-site") return Response.json({ error: "Requête non autorisée." }, { status: 403, headers });
  const key = createHash("sha256").update(request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown").digest("hex");
  const now = Date.now();
  for (const [id, bucket] of buckets) if (bucket.until < now) buckets.delete(id);
  const bucket = buckets.get(key) ?? { count: 0, until: now + 3600_000 };
  if (bucket.count >= 5 || buckets.size > 2000) return Response.json({ error: "Trop de demandes. Réessayez plus tard." }, { status: 429, headers });
  bucket.count++; buckets.set(key, bucket);
  try {
    const body = await request.text();
    if (body.length > 30000) return Response.json({ error: "Panier trop volumineux." }, { status: 413, headers });
    const data = JSON.parse(body);
    const result = await requestCartReminder(data);
    return Response.json({ ok: result.ok }, { headers });
  } catch {
    return Response.json({ error: "Impossible de demander le rappel. Vérifiez votre email, votre panier et votre accord, puis réessayez." }, { status: 400, headers });
  }
}
