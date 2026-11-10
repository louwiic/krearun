import { timingSafeEqual } from "node:crypto";
import { processCartReminders } from "@/lib/cart-reminder-service";
export const runtime = "nodejs";
export const maxDuration = 120;
export async function POST(request: Request) {
  const secret = process.env.CART_REMINDER_WORKER_SECRET || process.env.ASSISTANT_WORKER_SECRET;
  const supplied = request.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  if (!secret || Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return new Response(null, { status: 403 });
  try { return Response.json(await processCartReminders(), { headers: { "Cache-Control": "no-store" } }); }
  catch { return Response.json({ error: "Rappels indisponibles." }, { status: 503 }); }
}
