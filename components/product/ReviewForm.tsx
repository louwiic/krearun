"use client";

import type { FormEvent } from "react";
import { useState } from "react";

export default function ReviewForm({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus("sending");
    setError("");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        productName,
        authorName: formData.get("authorName"),
        email: formData.get("email"),
        rating: formData.get("rating"),
        message: formData.get("message"),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Impossible d'envoyer l'avis pour le moment.");
      setStatus("error");
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="rounded-blob bg-sage/15 p-5 text-sm leading-relaxed text-ink-soft">
        Merci pour votre retour. Il sera relu avant publication.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-blob bg-cream p-5 shadow-soft sm:p-6">
      <div>
        <h3 className="font-display text-xl font-semibold">Laisser un avis</h3>
        <p className="mt-1 text-sm text-ink-soft">
          Votre avis sera publié après validation.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold text-ink-soft">
          Prénom
          <input
            name="authorName"
            required
            className="rounded-2xl border border-sand bg-linen px-4 py-3 font-normal text-ink outline-none focus:border-terra"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-ink-soft">
          E-mail
          <input
            name="email"
            type="email"
            required
            className="rounded-2xl border border-sand bg-linen px-4 py-3 font-normal text-ink outline-none focus:border-terra"
          />
        </label>
      </div>

      <label className="grid gap-1.5 text-sm font-semibold text-ink-soft">
        Note
        <select
          name="rating"
          defaultValue="5"
          className="rounded-2xl border border-sand bg-linen px-4 py-3 font-normal text-ink outline-none focus:border-terra"
        >
          <option value="5">5 / 5</option>
          <option value="4">4 / 5</option>
          <option value="3">3 / 5</option>
          <option value="2">2 / 5</option>
          <option value="1">1 / 5</option>
        </select>
      </label>

      <label className="grid gap-1.5 text-sm font-semibold text-ink-soft">
        Votre avis
        <textarea
          name="message"
          required
          minLength={20}
          rows={4}
          className="resize-none rounded-2xl border border-sand bg-linen px-4 py-3 font-normal text-ink outline-none focus:border-terra"
        />
      </label>

      {error && <p className="text-sm font-semibold text-terra">{error}</p>}

      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-cream transition-colors hover:bg-terra disabled:cursor-wait disabled:opacity-60"
      >
        {status === "sending" ? "Envoi..." : "Envoyer l'avis"}
      </button>
    </form>
  );
}
