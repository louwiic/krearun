import { NextResponse } from "next/server";
import { createReview, getProductById } from "@/lib/store";
import { uploadSiteImageToR2 } from "@/lib/r2";
import sharp from "sharp";

export async function POST(req: Request) {
  try {
    const body = await req.formData();
    const productId = String(body.get("productId") ?? "").trim();
    const productName = String(body.get("productName") ?? "").trim();
    const authorName = String(body.get("authorName") ?? "").trim();
    const email = String(body.get("email") ?? "").trim().toLowerCase();
    const message = String(body.get("message") ?? "").trim();
    const rating = Number(body.get("rating") ?? 5);
    const photos = body.getAll("photo").filter((value): value is File => value instanceof File && value.size > 0);

    if (!productId || !productName || !authorName || !email || !message) {
      return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "E-mail invalide." }, { status: 400 });
    }
    if (message.length < 20) {
      return NextResponse.json({ error: "Avis trop court." }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Note invalide." }, { status: 400 });
    }
    if (authorName.length > 100 || email.length > 254 || message.length > 5000) {
      return NextResponse.json({ error: "Avis trop long." }, { status: 400 });
    }
    if (photos.length > 1 || (photos[0] && (photos[0].size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(photos[0].type)))) {
      return NextResponse.json({ error: "Ajoutez une seule photo JPEG, PNG ou WebP de moins de 5 Mo." }, { status: 400 });
    }

    const product = await getProductById(productId);
    if (!product || product.name !== productName) {
      return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
    }

    let imageUrl = "";
    if (photos[0]) {
      let optimized: Buffer;
      try {
        optimized = await sharp(Buffer.from(await photos[0].arrayBuffer()))
          .rotate()
          .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
      } catch {
        return NextResponse.json({ error: "Impossible de traiter cette photo. Choisissez une autre image." }, { status: 400 });
      }
      imageUrl = await uploadSiteImageToR2("reviews", new File([new Uint8Array(optimized)], "avis.webp", { type: "image/webp" }));
    }

    await createReview({
      productId,
      productName,
      authorName,
      email,
      rating,
      message,
      imageUrl,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Impossible d'enregistrer l'avis pour le moment." },
      { status: 500 }
    );
  }
}
