"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { GTA_GIFT_IMAGE } from "@/lib/gta-gift";

const SEEN = "krearun-gta-gift-popup-v1";
export default function GtaGiftPopup() {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(1);
  useEffect(() => {
    if (pathname.startsWith("/panier") || pathname.startsWith("/commande") || pathname.startsWith("/compte")) return;
    let seen = false;
    try { seen = sessionStorage.getItem(SEEN) === "1"; } catch { /* Session storage can be disabled. */ }
    if (seen) return;
    const timer = window.setTimeout(() => {
      if (document.querySelector("dialog[open]")) return;
      dialog.current?.showModal();
      try { sessionStorage.setItem(SEEN, "1"); } catch { /* No storage required to close. */ }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [pathname]);
  function close() { dialog.current?.close(); }
  return <dialog ref={dialog} aria-labelledby="gta-gift-heading" onClick={event => { if (event.target === event.currentTarget) close(); }} className="m-auto w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-3xl border-2 border-ink bg-cream p-0 text-ink shadow-2xl backdrop:bg-ink/55">
    <button type="button" aria-label="Fermer l’offre GTA 6" onClick={close} className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-sand bg-cream text-2xl">×</button>
    {/* eslint-disable-next-line @next/next/no-img-element -- Local campaign product photograph. */}
    <img src={GTA_GIFT_IMAGE} alt="Porte-clés GTA VI rose et bleu offert avec un produit GTA" width={600} height={600} className="h-52 w-full bg-linen object-contain sm:h-60" />
    <div className="p-6 sm:p-7">
      <p className="text-xs font-bold uppercase tracking-widest text-terra">Le cadeau de la collection GTA 6</p>
      <h2 id="gta-gift-heading" className="mt-3 font-display text-3xl font-extrabold leading-tight">{step === 1 ? "Ton porte-clé GTA 6 offert !" : "Un produit GTA, deux cadeaux."}</h2>
      {step === 1 ? <>
        <p className="mt-4 text-sm leading-6 text-ink-soft">Pour l’achat d’un produit GTA : ce porte-clés est offert. Et on ajoute aussi ton porte-clés prénom en police GTA !</p>
        <button type="button" onClick={() => setStep(2)} className="mt-6 w-full rounded-full bg-terra px-5 py-3 font-bold text-cream">Oui, je veux !</button>
        <button type="button" onClick={close} className="mt-3 w-full py-2 text-sm underline">Continuer ma visite</button>
      </> : <>
        <ol className="mt-4 space-y-3 text-sm leading-6"><li><strong>1.</strong> Choisis un produit de la collection GTA 6.</li><li><strong>2.</strong> Ton porte-clés GTA VI rose et bleu est ajouté gratuitement.</li><li><strong>3.</strong> Renseigne ton prénom dans le panier pour ton second porte-clés offert, en police GTA.</li></ol>
        <Link href="/boutique?categorie=gta-6" onClick={close} className="mt-6 block rounded-full bg-terra px-5 py-3 text-center font-bold text-cream">Je choisis mon produit GTA →</Link>
      </>}
      <p className="mt-4 text-xs leading-5 text-ink-soft">Une paire de cadeaux par commande contenant au moins un produit GTA payant. Prénom à renseigner avant paiement. Cadeaux ajoutés au même colis ; livraison du produit acheté selon le tarif affiché au panier.</p>
    </div>
  </dialog>;
}
