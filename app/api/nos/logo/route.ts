import sharp from "sharp";
import { createHash } from "node:crypto";
import { holderFormData } from "@/lib/custom-holder-http";
import { createNosLogo, getProductBySlug } from "@/lib/store";
import { NOS_SLUG } from "@/lib/nos";

const attempts = new Map<string, { count: number; until: number }>();
export async function POST(request: Request) {
  try {
    const key = createHash("sha256").update(request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown").digest("hex");
    const now = Date.now();
    for (const [id, bucket] of attempts) if (bucket.until < now) attempts.delete(id);
    const bucket = attempts.get(key) || {count:0, until:now + 3600000};
    if (bucket.count >= 10 || attempts.size > 2000) return Response.json({error:"Trop d’envois. Réessayez dans une heure."}, {status:429});
    bucket.count++; attempts.set(key, bucket);
    const product = await getProductBySlug(NOS_SLUG);
    if (!product?.active) return Response.json({error:"Produit indisponible."}, {status:400});
    const form = await holderFormData(request);
    const file = form.get("logo");
    if (!(file instanceof File) || file.size === 0 || file.size > 5*1024*1024 || !["image/png","image/jpeg","image/webp"].includes(file.type)) {
      return Response.json({error:"Choisissez une image PNG, JPEG ou WebP de 5 Mo maximum."}, {status:400});
    }
    const image = await sharp(Buffer.from(await file.arrayBuffer()), {limitInputPixels:20000000}).rotate().resize({width:2400,height:2400,fit:"inside",withoutEnlargement:true}).png().toBuffer();
    const id = await createNosLogo(image);
    return Response.json({id}, {headers:{"Cache-Control":"no-store"}});
  } catch { return Response.json({error:"Impossible d’envoyer ce logo. Vérifiez votre image et réessayez."}, {status:400}); }
}
