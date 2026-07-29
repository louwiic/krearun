import { NextResponse } from "next/server";
import { addSubscriber, getSettings } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (typeof email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "E-mail invalide" }, { status: 400 });
    }
    await addSubscriber(email.trim());
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
