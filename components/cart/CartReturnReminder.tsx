"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "./CartContext";
import { shouldShowCartReturn } from "@/lib/cart-reminders";
const LAST_SEEN = "krearun:cart:last-seen";
export default function CartReturnReminder() {
  const { count, hydrated, isOpen } = useCart();
  const pathname = usePathname();
  const initialized = useRef(false);
  const [returning, setReturning] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (!hydrated) return;
    if (!initialized.current) {
    initialized.current = true;
    try {
      const previous = Number(localStorage.getItem(LAST_SEEN));
      // This state reflects a previous visit loaded after browser cart hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReturning(shouldShowCartReturn(previous, count));
    } catch { /* A blocked storage area does not interrupt shopping. */ }
    }
    function leave() { try { localStorage.setItem(LAST_SEEN, String(Date.now())); } catch {} }
    function visibility() { if (document.visibilityState === "hidden") leave(); }
    leave();
    window.addEventListener("pagehide", leave);
    document.addEventListener("visibilitychange", visibility);
    return () => { window.removeEventListener("pagehide", leave); document.removeEventListener("visibilitychange", visibility); };
  }, [hydrated, count]);
  if (!returning || dismissed || !count || isOpen || /^\/(?:panier|commande|compte|connexion)/.test(pathname)) return null;
  return <aside aria-label="Votre panier sauvegardé" className="border-b border-sand bg-cream px-4 py-4"><div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3"><p className="min-w-0 flex-1 text-sm"><strong>Votre panier vous attend.</strong> Retrouvez vos {count} article{count > 1 ? "s" : ""} et terminez votre commande.</p><Link href="/panier" onClick={() => setDismissed(true)} className="rounded-full bg-terra px-5 py-2.5 text-sm font-bold text-white">Reprendre mon panier</Link><button type="button" onClick={() => setDismissed(true)} aria-label="Fermer le rappel du panier" className="grid h-10 w-10 place-items-center text-xl">×</button></div></aside>;
}
