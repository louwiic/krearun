"use client";

import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="rounded-2xl bg-sage/25 px-5 py-4 text-sm font-semibold text-sage-deep">
        Merci ! Vous recevrez bientôt de nos douces nouvelles ✿
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-md gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="votre@email.fr"
        className="w-full rounded-full border border-sand bg-cream px-5 py-3 text-sm outline-none transition-colors placeholder:text-ink-faint focus:border-terra"
      />
      <button
        type="submit"
        disabled={state === "loading"}
        className="shrink-0 rounded-full bg-ink px-6 py-3 text-sm font-bold text-cream transition-colors hover:bg-terra disabled:opacity-60"
      >
        {state === "loading" ? "…" : "S'abonner"}
      </button>
      {state === "error" && (
        <p className="text-xs text-terra-deep">Oups, réessayez.</p>
      )}
    </form>
  );
}
