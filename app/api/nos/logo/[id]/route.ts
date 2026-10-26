import { isAdmin } from "@/lib/auth";
import { getNosLogoImage } from "@/lib/store";
export async function GET(_request: Request, {params}: {params:Promise<{id:string}>}) {
  if (!(await isAdmin())) return new Response(null, {status:404});
  const {id} = await params;
  const image = await getNosLogoImage(id);
  if (!image) return new Response(null, {status:404});
  return new Response(new Uint8Array(image), {headers:{"Content-Type":"image/png", "Content-Disposition":'attachment; filename="logo-nos.png"', "Cache-Control":"private, no-store", "X-Content-Type-Options":"nosniff"}});
}
