import { NextResponse } from "next/server";
import { sendProductQuestion } from "@/lib/email";
import { getProductBySlug, getSettings } from "@/lib/store";
import { withPublicProductName } from "@/lib/public-copy";

const attempts = new Map<string, number[]>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.website) return NextResponse.json({ ok: true });
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!slug || slug.length > 160 || !name || name.length > 100 || email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || message.length < 10 || message.length > 5000) {
      return NextResponse.json({ error: "Vérifiez les champs et écrivez un message d’au moins 10 caractères." }, { status: 400 });
    }
    const now = Date.now();
    for (const [key, times] of attempts) if (times.every(time => now - time > 3600000)) attempts.delete(key);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const recent = (attempts.get(ip) || []).filter(time => now - time < 3600000);
    if (recent.length >= 5) return NextResponse.json({ error: "Trop de demandes. Réessayez dans un moment." }, { status: 429 });
    attempts.set(ip, [...recent, now]);
    const [record, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
    if (!record?.active) return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
    const product = withPublicProductName(record);
    const sent = await sendProductQuestion(settings.contact_email, product.name, product.slug, name, email, message);
    if (!sent) return NextResponse.json({ error: "L’envoi n’a pas abouti. Réessayez ou contactez-nous par e-mail." }, { status: 503 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Impossible d’envoyer votre message pour le moment." }, { status: 500 });
  }
}
