import { NextResponse } from "next/server";
import { createReview, getProductById } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const productId = String(body.productId ?? "").trim();
    const productName = String(body.productName ?? "").trim();
    const authorName = String(body.authorName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const message = String(body.message ?? "").trim();
    const rating = Number(body.rating ?? 5);

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

    const product = await getProductById(productId);
    if (!product || product.name !== productName) {
      return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
    }

    await createReview({
      productId,
      productName,
      authorName,
      email,
      rating,
      message,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Impossible d'enregistrer l'avis pour le moment." },
      { status: 500 }
    );
  }
}
