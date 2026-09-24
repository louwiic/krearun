"use client";

import { useState } from "react";
import ReviewForm from "./ReviewForm";

export default function ReviewPicker({ products }: { products: { id: string; name: string }[] }) {
  const [id, setId] = useState("");
  const product = products.find((item) => item.id === id);
  return (
    <div className="space-y-5">
      <label className="grid gap-2 text-sm font-semibold text-ink-soft">
        Pour quel produit souhaitez-vous laisser un avis ?
        <select value={id} onChange={(event) => setId(event.target.value)} className="rounded-2xl border border-sand bg-cream px-4 py-3 text-ink">
          <option value="">Choisir un produit</option>
          {products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      {product && <ReviewForm key={product.id} productId={product.id} productName={product.name} />}
    </div>
  );
}
