import { cancelCartReminder } from "@/lib/cart-reminder-service";
import { REMINDER_TOKEN } from "@/lib/cart-reminders";
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!REMINDER_TOKEN.test(token)) return new Response(null, { status: 400 });
  const form = await request.formData();
  if (form.get("List-Unsubscribe") !== "One-Click") return new Response(null, { status: 400 });
  await cancelCartReminder(token);
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
