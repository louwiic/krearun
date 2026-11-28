"use client";

import { useRef, useState, type FormEvent } from "react";

export default function ProductQuestion({ slug, name }: { slug: string; name: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    setStatus("sending");
    try {
      const response = await fetch("/api/product-question", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name: fields.get("name"), email: fields.get("email"), message: fields.get("message"), website: fields.get("website") }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Impossible d’envoyer votre message.");
      form.reset();
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d’envoyer votre message.");
      setStatus("error");
    }
  }

  return <>
    <button type="button" onClick={() => { setStatus("idle"); dialog.current?.showModal(); }} className="mt-4 w-full rounded-xl border border-sand bg-white px-4 py-3 text-sm font-bold text-ink transition-colors hover:border-terra hover:text-terra">
      Une question ? Demander plus d’informations
    </button>
    <dialog ref={dialog} aria-labelledby="product-question-title" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }} className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-3xl border border-sand bg-cream p-5 text-ink shadow-lifted backdrop:bg-ink/50 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div><h2 id="product-question-title" className="font-display text-2xl font-semibold">Demander plus d’informations</h2><p className="mt-2 text-sm text-ink-soft">À propos de : <strong>{name}</strong></p></div>
        <button type="button" aria-label="Fermer" onClick={() => dialog.current?.close()} className="rounded-full border border-sand px-3 py-2">✕</button>
      </div>
      {status === "sent" ? <div role="status" className="mt-6 rounded-xl bg-sage/20 p-4 text-sm">Merci ! Votre message a bien été envoyé. Nous vous répondrons par e-mail.</div> : <form onSubmit={submit} className="mt-6 grid gap-4">
        <label className="grid gap-1.5 text-sm font-bold">Votre nom<input name="name" required maxLength={100} autoComplete="name" className="w-full rounded-xl border border-sand bg-white px-4 py-3 font-normal" /></label>
        <label className="grid gap-1.5 text-sm font-bold">Votre e-mail<input name="email" type="email" required maxLength={254} autoComplete="email" className="w-full rounded-xl border border-sand bg-white px-4 py-3 font-normal" /></label>
        <label className="grid gap-1.5 text-sm font-bold">Votre question<textarea name="message" required minLength={10} maxLength={5000} rows={5} className="w-full rounded-xl border border-sand bg-white px-4 py-3 font-normal" /></label>
        <label className="hidden" aria-hidden="true">Site web<input name="website" tabIndex={-1} autoComplete="off" /></label>
        {status === "error" && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={status === "sending"} className="rounded-xl bg-ink px-4 py-3 text-sm font-bold text-cream transition-colors hover:bg-terra disabled:opacity-60">{status === "sending" ? "Envoi en cours…" : "Envoyer ma question"}</button>
      </form>}
    </dialog>
  </>;
}
