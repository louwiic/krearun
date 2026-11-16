"use client";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import CartRewards from "@/components/cart/CartRewards";
import { useCart } from "@/components/cart/CartContext";

export default function RewardsLauncher() {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const { isOpen } = useCart();
  if (pathname === "/panier") return null;
  return <>
    {!isOpen && <button type="button" onClick={() => dialog.current?.showModal()} className="fixed bottom-5 right-4 z-30 rounded-full border border-sand bg-ink px-4 py-3 text-xs font-bold text-cream shadow-lifted sm:bottom-6 sm:right-6">✦ Mes récompenses</button>}
    <dialog ref={dialog} aria-label="Mes récompenses" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }} className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl bg-linen p-5 text-ink shadow-lifted backdrop:bg-ink/40">
      <div className="mb-3 flex justify-end"><button type="button" aria-label="Fermer les récompenses" onClick={() => dialog.current?.close()} className="rounded-full border border-sand px-3 py-2">✕</button></div>
      <CartRewards />
    </dialog>
  </>;
}
