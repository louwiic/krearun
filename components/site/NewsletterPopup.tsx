"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "krearun-newsletter-popup-hidden-at";
const HIDE_FOR_MS = 14 * 24 * 60 * 60 * 1000;

type Props = {
  enabled: boolean;
  discountPct: number;
  delaySeconds: number;
  title: string;
  text: string;
  storeName: string;
};

export default function NewsletterPopup({
  enabled,
  discountPct,
  delaySeconds,
  title,
  text,
  storeName,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [promoCode, setPromoCode] = useState("");

  useEffect(() => {
    if (!enabled) return;
    const hiddenAt = Number(window.localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Date.now() - hiddenAt < HIDE_FOR_MS) return;
    const timer = window.setTimeout(() => setVisible(true), delaySeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [enabled, delaySeconds]);

  function close() {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setVisible(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email || !consent) return;
    setState("loading");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Inscription impossible");
      setPromoCode(data.code ?? "");
      setState("success");
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      setState("error");
    }
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/35 p-3 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="newsletter-popup-title"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-cream shadow-2xl">
        <button
          type="button"
          onClick={close}
          aria-label="Fermer"
          className="absolute right-4 top-4 z-10 rounded-full bg-cream/90 p-2 text-ink-soft shadow-sm transition hover:text-ink"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="bg-gradient-to-br from-terra to-terra-deep px-7 py-8 text-cream">
          <svg className="mb-4 h-9 w-9 text-blush" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
          </svg>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blush">
            Bienvenue chez {storeName}
          </p>
          <h2 id="newsletter-popup-title" className="max-w-xs text-3xl font-extrabold leading-tight">
            {discountPct} % offerts
          </h2>
          <p className="mt-2 text-lg font-semibold text-cream">{title}</p>
          <p className="mt-3 text-sm leading-relaxed text-linen-deep">{text}</p>
        </div>

        <div className="p-7">
          {state === "success" ? (
            <div className="text-center">
              <p className="text-lg font-bold text-ink">Inscription confirmée ✿</p>
              {promoCode && (
                <p className="mt-3 rounded-xl bg-sage/25 px-4 py-3 text-sm text-sage-deep">
                  Votre code : <strong className="font-mono tracking-widest">{promoCode}</strong>
                </p>
              )}
              <button type="button" onClick={close} className="mt-5 text-sm font-semibold text-terra">
                Continuer sur {storeName}
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="votre@email.fr"
                className="w-full rounded-xl border border-sand bg-cream px-4 py-3 text-sm outline-none transition-colors focus:border-terra"
              />
              <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-ink-soft">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  required
                  className="mt-0.5 h-4 w-4 accent-terra"
                />
                J&apos;accepte de recevoir les offres et actualités de {storeName}. Je pourrai me
                désinscrire à tout moment.
              </label>
              <button
                type="submit"
                disabled={state === "loading" || !consent}
                className="w-full rounded-xl bg-ink px-5 py-3 font-bold text-cream transition-colors hover:bg-terra disabled:cursor-not-allowed disabled:opacity-50"
              >
                {state === "loading" ? "Inscription…" : `Recevoir mon code -${discountPct} %`}
              </button>
              {state === "error" && (
                <p role="alert" className="text-center text-xs text-terra-deep">
                  Une erreur est survenue. Réessayez dans quelques instants.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
