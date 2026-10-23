"use client";

import Link from "next/link";
import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent }),
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
    <form onSubmit={submit} className="w-full max-w-md space-y-3">
      <div className="flex gap-2">
      <input
        type="email"
        aria-label="Adresse e-mail"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="votre@email.fr"
        className="min-w-0 w-full rounded-full border border-sand bg-cream px-5 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-terra"
      />
      <button
        type="submit"
        disabled={state === "loading" || !consent}
        className="shrink-0 rounded-full bg-ink px-6 py-3 text-sm font-bold text-cream transition-colors hover:bg-terra disabled:opacity-60"
      >
        {state === "loading" ? "…" : "S'abonner"}
      </button>
      </div>
      <label className="flex items-start gap-2 text-xs leading-5"><input type="checkbox" required checked={consent} onChange={e=>setConsent(e.target.checked)} className="mt-1 h-4 w-4 shrink-0"/><span>J’accepte de recevoir les offres et actualités de Kréarun. Désinscription possible par e-mail à tout moment. <Link className="underline" href="/confidentialite">Utilisation de mes données</Link>.</span></label>
      {state === "error" && (
        <p className="text-xs text-terra-deep">Oups, réessayez.</p>
      )}
    </form>
  );
}
