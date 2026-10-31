"use client";

import Script from "next/script";
import { AUDIENCE_CONSENT_KEY } from "@/lib/privacy";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
const STORAGE_KEY = AUDIENCE_CONSENT_KEY;
const CHANGE_EVENT = "krearun:privacy-change";
const OPEN_EVENT = "krearun:privacy-open";
function snapshot() {
  try { const date = Number(localStorage.getItem(`${STORAGE_KEY}:date-ms`)); if (!date || Date.now() - date > 183 * 24 * 60 * 60_000) return "unset"; const value = localStorage.getItem(STORAGE_KEY); return value === "accepted" || value === "rejected" ? value : "unset"; }
  catch { return "unset"; }
}
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback); window.addEventListener(CHANGE_EVENT, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(CHANGE_EVENT, callback); };
}
export function PrivacyPreferencesButton() {
  return <button type="button" className="text-left hover:text-[#FF6B35]" onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>Préférences de confidentialité</button>;
}
export default function PrivacyPreferences() {
  const choice = useSyncExternalStore(subscribe, snapshot, () => "pending");
  const [opened, setOpened] = useState(false);
  const [temporaryChoice, setTemporaryChoice] = useState("");
  useEffect(() => { const open = () => setOpened(true); window.addEventListener(OPEN_EVENT, open); return () => window.removeEventListener(OPEN_EVENT, open); }, []);
  const current = temporaryChoice || choice;
  function choose(next: "accepted" | "rejected") {
    const previouslyAccepted = current === "accepted";
    try { localStorage.setItem(STORAGE_KEY, next); localStorage.setItem(`${STORAGE_KEY}:date-ms`, String(Date.now())); if (next === "rejected") localStorage.removeItem("krearun-letter-visitor"); } catch { /* Choice still works for this page when storage is unavailable. */ }
    setTemporaryChoice(next); setOpened(false); window.dispatchEvent(new Event(CHANGE_EVENT));
    // A loaded audience script cannot reliably be unloaded; restarting the page stops it.
    if (previouslyAccepted && next === "rejected") window.location.reload();
  }
  return <>
    {current === "accepted" && <Script defer data-domain="krearun.re" src="https://analytics.peibox.fr/js/script.js" strategy="afterInteractive" />}
    {(current === "unset" || opened) && <section role="dialog" aria-label="Vos préférences de confidentialité" className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-xl rounded-2xl border-2 border-ink bg-cream p-5 shadow-lifted sm:inset-x-6 sm:p-6">
      <h2 className="font-display text-xl">Votre confidentialité</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">Les cookies techniques servent au panier et à votre session. Avec votre accord, nous activons aussi une mesure d’audience pour comprendre la fréquentation du site et les étapes du parcours jusqu’au panier et au paiement. Vous pouvez refuser et modifier votre choix à tout moment.</p>
      <Link href="/confidentialite" className="mt-3 inline-block text-sm font-bold underline">En savoir plus</Link>
      <div className="mt-4 grid grid-cols-2 gap-3"><button type="button" className="rounded-[10px] border-2 border-ink bg-cream px-4 py-3 text-sm font-bold" onClick={() => choose("rejected")}>Refuser</button><button type="button" className="rounded-[10px] border-2 border-ink bg-cream px-4 py-3 text-sm font-bold" onClick={() => choose("accepted")}>Accepter</button></div>
    </section>}
  </>;
}
