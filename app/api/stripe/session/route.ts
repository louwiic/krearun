import { NextResponse } from "next/server";
import { getStripe, stripeConfigured } from "@/lib/stripe";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId || !stripeConfigured()) {
    return NextResponse.json({});
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });
    return NextResponse.json({
      customerEmail: session.customer_details?.email ?? session.customer_email ?? null,
      amountTotalCents: session.amount_total ?? null,
      itemCount:
        session.line_items?.data.reduce(
          (count, line) => count + (line.quantity ?? 1),
          0
        ) ?? null,
      paymentStatus: session.payment_status,
    });
  } catch {
    return NextResponse.json({});
  }
}
