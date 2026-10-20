import { createHash } from "node:crypto";
import { createWithdrawal, markWithdrawalMail } from "@/lib/store";
import { sendWithdrawalMail } from "@/lib/email";
import { parseWithdrawal, withdrawalReceipt } from "@/lib/withdrawal";
const attempts = new Map<string, { count: number; until: number }>();
const headers = { "Cache-Control": "private, no-store" };
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get("sec-fetch-site") === "cross-site") return Response.json({ error: "Origine refusée." }, { status: 403, headers });
  if (Number(request.headers.get("content-length")) > 8000) return Response.json({ error: "Demande trop longue." }, { status: 413, headers });
  let raw: string;
  try { raw = await request.text(); } catch { return Response.json({ error: "Demande illisible." }, { status: 400, headers }); }
  if (raw.length > 8000) return Response.json({ error: "Demande trop longue." }, { status: 413, headers });
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return Response.json({ error: "Demande invalide." }, { status: 400, headers }); }
  if (body && typeof body === "object" && "website" in body && body.website) return Response.json({ error: "Demande invalide." }, { status: 400, headers });
  const declaration = parseWithdrawal(body);
  if (!declaration) return Response.json({ error: "Indiquez vos nom, prénom, e-mail et les éléments permettant d’identifier le contrat." }, { status: 400, headers });
  const key = createHash("sha256").update(request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || declaration.email).digest("hex");
  const now = Date.now();
  for (const [id, value] of attempts) if (value.until < now) attempts.delete(id);
  const attempt = attempts.get(key) ?? { count: 0, until: now + 15 * 60_000 };
  if (attempt.count >= 5 || attempts.size > 10_000) return Response.json({ error: "Trop de tentatives. Réessayez dans quelques minutes ou utilisez l’e-mail ou le courrier indiqués dans les CGV." }, { status: 429, headers });
  attempt.count++; attempts.set(key, attempt);
  try {
    const record = await createWithdrawal(declaration);
    const receipt = withdrawalReceipt(record);
    // Persistence comes first: an unavailable e-mail service must never lose a declaration.
    const results = await Promise.allSettled([
      record.receiptSent ? Promise.resolve(true) : sendWithdrawalMail(record, receipt, "customer").then(async sent => { if (sent) await markWithdrawalMail(record.id, "receiptSent"); return sent; }),
      record.notificationSent ? Promise.resolve(true) : sendWithdrawalMail(record, receipt, "admin").then(async sent => { if (sent) await markWithdrawalMail(record.id, "notificationSent"); return sent; }),
    ]);
    return Response.json({ ok: true, reference: record.id, receivedAt: record.receivedAt, receipt, emailSent: results[0].status === "fulfilled" && results[0].value }, { headers });
  } catch {
    console.error("[Withdrawal] Declaration persistence unavailable");
    return Response.json({ error: "La déclaration n’a pas pu être enregistrée. Réessayez ou utilisez l’e-mail ou le courrier indiqués dans les CGV." }, { status: 503, headers });
  }
}
