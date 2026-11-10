"use client";
import { useState } from "react";
import Link from "next/link";
import { useCart } from "./CartContext";
import { CART_REMINDER_CONSENT, CART_REMINDER_CONSENT_VERSION, reminderCart } from "@/lib/cart-reminders";
export default function CartReminderSignup() {
  const { items, hydrated } = useCart();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  if (!hydrated || !items.length) return null;
  return <section className="mt-7 rounded-2xl border border-sand bg-cream p-5 sm:p-6" aria-labelledby="cart-reminder-title">
    <h2 id="cart-reminder-title" className="font-display text-xl font-bold">Vous préférez terminer plus tard ?</h2>
    <p className="mt-2 text-sm text-ink-soft">Demandez un seul rappel par email. Après confirmation de votre adresse, nous vous écrirons dans environ une heure si votre achat n’est pas confirmé. Aucune inscription à la newsletter.</p>
    {!saved && <form className="mt-4 space-y-3" onSubmit={async event => {
      event.preventDefault(); setSending(true); setMessage("");
      try {
        const response = await fetch("/api/cart-reminders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, consent, version: CART_REMINDER_CONSENT_VERSION, cart: reminderCart(items) }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Demande indisponible.");
        setSaved(true); setMessage("Si une nouvelle demande peut être créée pour cette adresse, un email de confirmation vous sera envoyé. Consultez aussi vos indésirables. Une demande récente n’entraîne pas de nouvel envoi.");
      } catch (error) { setMessage(error instanceof Error ? error.message : "Demande indisponible."); }
      finally { setSending(false); }
    }}>
      <label className="block text-sm font-semibold">Votre email<input type="email" autoComplete="email" required maxLength={160} value={email} onChange={event => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-sand bg-white px-4 py-3" placeholder="vous@exemple.fr" /></label>
      <label className="flex items-start gap-3 text-sm"><input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-1 shrink-0" /><span>{CART_REMINDER_CONSENT}</span></label>
      <p className="text-xs text-ink-soft">Facultatif, sans effet sur votre achat. Votre email, votre panier et la preuve de votre accord sont conservés 30 jours maximum pour ce rappel. <Link href="/confidentialite" className="underline">Confidentialité et droits</Link></p>
      <button disabled={sending || !consent} className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white disabled:opacity-50">{sending ? "Envoi en cours…" : "Me rappeler ce panier"}</button>
    </form>}
    {message && <p role="status" className="mt-4 text-sm">{message}</p>}
  </section>;
}
