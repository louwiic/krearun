import { createHash } from "node:crypto";
import { isAdmin } from "@/lib/auth";
import { parseJourneyEvent } from "@/lib/purchase-journey";
import { getProductById, recordPurchaseEvent } from "@/lib/store";
import { CLICKER_PRODUCT, CLICKER_PRODUCT_ID } from "@/lib/clicker";
import { siteOrigin } from "@/lib/seo";
const buckets = new Map<string, { count: number; until: number }>();
export async function POST(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  const result = (status: number) => new Response(null, { status, headers });
  const origin = request.headers.get("origin");
  if (!origin || ![new URL(request.url).origin, siteOrigin()].includes(origin) || request.headers.get("sec-fetch-site") === "cross-site") return result(403);
  if (await isAdmin() || /bot|crawler|spider|headless|preview/i.test(request.headers.get("user-agent") || "")) return result(204);
  const now = Date.now();
  for (const [key,bucket] of buckets) if (bucket.until < now) buckets.delete(key);
  const key = createHash("sha256").update(request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown").digest("hex");
  const bucket = buckets.get(key) ?? { count: 0, until: now + 60000 };
  if (bucket.count >= 120 || buckets.size > 2000) return result(429);
  bucket.count++; buckets.set(key,bucket);
  let value: unknown;
  try {
    if (Number(request.headers.get("content-length")) > 8192) return result(413);
    const reader = request.body?.getReader(); if (!reader) return result(400);
    const chunks: Uint8Array[] = []; let size = 0;
    for (;;) { const {value,done} = await reader.read(); if (done) break; size += value.length; if (size > 8192) { await reader.cancel(); return result(413); } chunks.push(value); }
    const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.length; }
    value = JSON.parse(new TextDecoder().decode(bytes));
  } catch { return result(400); }
  const event = parseJourneyEvent(value); if (!event) return result(400);
  try {
    const ids = [...new Set([...event.items.map(i=>i.productId), ...(event.productId ? [event.productId] : [])])];
    const products = new Map(await Promise.all(ids.map(async id => [id, id === CLICKER_PRODUCT_ID ? CLICKER_PRODUCT : await getProductById(id)] as const)));
    if (ids.some(id => !products.get(id)?.active)) return result(400);
    event.items = event.items.map(item => {
      const product = products.get(item.productId)!;
      const variant = product.variants.find(v=>v.id === item.variantId && v.active);
      return { productId: product.id, quantity: item.quantity, unitPriceCents: variant?.priceCents || product.priceCents, ...(variant ? {variantId:variant.id} : {}) };
    });
    await recordPurchaseEvent(event); return result(202);
  } catch { console.error("[Purchase journeys] Persistence unavailable"); return result(503); }
}
