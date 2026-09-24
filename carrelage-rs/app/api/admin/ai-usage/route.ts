import { isAdmin } from "@/lib/admin";
import { readUsage } from "@/lib/ai-usage-store";
export async function GET() {
  if (!(await isAdmin())) return new Response(null, { status: 401 });
  try {
    return Response.json(await readUsage(), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return Response.json(
      { error: "Statistiques indisponibles." },
      { status: 503 },
    );
  }
}
