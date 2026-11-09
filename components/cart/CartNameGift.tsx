"use client";

import { useRef, useState } from "react";

export default function CartNameGift({ value, onChange, title, description, image, cta }: { value: string; onChange: (name: string) => void; title: string; description: string; image: string; cta: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(value);
  const [opened, setOpened] = useState(false);

  function open() {
    setDraft(value);
    setOpened(true);
    dialog.current?.showModal();
    requestAnimationFrame(() => input.current?.focus());
  }

  function confirm() {
    const name = draft.trim().replace(/\s+/g, " ");
    if (!input.current?.reportValidity() || !name) return;
    onChange(name);
    setOpened(false);
    dialog.current?.close();
    // Continue through the existing checkout, including contact details and terms.
    requestAnimationFrame(() => {
      const form = dialog.current?.closest("form");
      if (!form || !form.reportValidity()) return;
      const payment = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (payment && !payment.disabled) form.requestSubmit(payment);
      else {
        const terms = form.querySelector<HTMLInputElement>('input[type="checkbox"]:not(:checked)');
        (terms ?? payment)?.scrollIntoView({ behavior: "smooth", block: "center" });
        (terms ?? payment)?.focus();
      }
    });
  }

  return <>
    <section aria-label="Votre cadeau offert" className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-terra bg-cream p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-6px_30px_rgba(0,0,0,0.10)] sm:p-5">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 sm:gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- User-supplied campaign photograph. */}
        <img src={image} alt="Porte-clés colorés personnalisés avec un prénom" width={80} height={80} className="h-14 w-14 rounded-xl object-cover sm:h-20 sm:w-20" />
        <div className="min-w-0 flex-1 basis-48">
          <p className="text-xs font-bold uppercase tracking-wider text-terra">Votre cadeau offert</p>
          <h2 className="mt-1 font-display text-base font-bold sm:text-xl">{title}</h2>
          <p className="mt-2 text-sm text-ink-soft">{description}</p>
          {value && <p role="status" className="mt-2 text-sm font-bold">Votre cadeau : porte-clés « {value} » — offert</p>}
        </div>
        <button type="button" onClick={open} className="w-full rounded-full bg-terra px-6 py-3 text-sm font-bold text-cream hover:bg-terra-deep sm:w-auto">{value ? "Modifier le prénom" : cta}</button>
      </div>
    </section>
    <dialog ref={dialog} onClose={() => setOpened(false)} className="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-2xl border-2 border-ink bg-cream p-6 shadow-lifted backdrop:bg-ink/40" aria-labelledby="gift-title">
      <h2 id="gift-title" className="font-display text-2xl font-bold">Quel prénom pour votre cadeau ?</h2>
      <p className="mt-3 text-sm text-ink-soft">Indiquez le prénom à fabriquer, puis poursuivez votre achat. Le cadeau sera ajouté à votre commande après paiement.</p>
      <label className="mt-5 block text-sm font-bold">Prénom sur le porte-clés
        <input ref={input} value={draft} onChange={event => setDraft(event.target.value)} disabled={!opened} required={opened} maxLength={24} pattern="[\p{L}\p{M} ’‐\x2D]+" autoComplete="off" placeholder="Ex. Léa" onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); confirm(); } }} className="mt-2 w-full rounded-xl border border-sand bg-linen px-4 py-3 outline-none focus:border-terra" />
      </label>
      <p className="mt-2 text-xs text-ink-soft">24 caractères maximum. Vérifiez l’orthographe avant de valider.</p>
      <button type="button" onClick={confirm} className="mt-5 w-full rounded-full bg-terra px-5 py-3 text-sm font-bold text-cream hover:bg-terra-deep">Valider mon cadeau et continuer</button>
      <button type="button" onClick={() => dialog.current?.close()} className="mt-3 w-full py-2 text-sm underline">Revenir au panier</button>
    </dialog>
  </>;
}
