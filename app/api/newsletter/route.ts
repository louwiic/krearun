import { LEGAL_VERSION } from "@/lib/legal";
import { NextResponse } from "next/server";
import { addSubscriber, getSettings } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const { email, consent } = await req.json();
    if (consent !== true) return NextResponse.json({ error: "Votre accord est nécessaire pour recevoir la newsletter." }, { status: 400 });
    if (typeof email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "E-mail invalide" }, { status: 400 });
    }
    await addSubscriber(email.trim(), { version: LEGAL_VERSION, at: new Date().toISOString() });
    const settings = await getSettings();
    return NextResponse.json({
      ok: true,
      code: settings.newsletter_popup_promo_code,
      discountPct: settings.newsletter_popup_discount_pct,
    });
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
}
