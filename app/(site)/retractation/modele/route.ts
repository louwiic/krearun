import { WITHDRAWAL_TEMPLATE } from "@/lib/legal";
export function GET() {
  return new Response(WITHDRAWAL_TEMPLATE, { headers: { "Content-Type": "text/plain; charset=utf-8", "Content-Disposition": 'attachment; filename="formulaire-retractation-krearun.txt"' } });
}
