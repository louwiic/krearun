"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AdminNotice } from "@/lib/admin-notice";

export default function AdminToasts({ notice }: { notice?: AdminNotice }) {
  const [items, setItems] = useState<AdminNotice[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const push = useCallback((item: AdminNotice) => {
    setItems(current => current.some(old => old.id === item.id || old.message === item.message) ? current : [...current.slice(-2), item]);
    timers.current.push(setTimeout(() => setItems(current => current.filter(old => old.id !== item.id)), item.kind === "error" ? 12000 : 6000));
  }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    if (!notice) return;
    try { if (sessionStorage.getItem("krearun:last-admin-notice") === notice.id) return; sessionStorage.setItem("krearun:last-admin-notice", notice.id); } catch {}
    queueMicrotask(() => push(notice));
  }, [notice, push]);
  useEffect(() => {
    const seen = new WeakMap<Element, string>();
    const root = document.querySelector("main") || document.body;
    const scan = (initial = false) => {
      root.querySelectorAll('[role="status"], [role="alert"]').forEach(element => {
        if (element.closest("[data-admin-toasts]")) return;
        const message = element.textContent?.trim().replace(/\s+/g, " ") || "";
        if (seen.get(element) === message) return;
        seen.set(element, message);
        if (initial || !message) return;
        const error = element.getAttribute("role") === "alert" || /impossible|erreur|échou|échec|invalide|n’a pas pu|n'a pas pu/i.test(message);
        if (!error && (/…$|\.\.\.$|en cours|à enregistrer|modifications/i.test(message) || !/enregistr|ajout|supprim|modifi|mis[e]? à jour|copi|envoy|valid|généré|télécharg|réactiv|désactiv|appliqu|succès|publi|masqu|créé|termin/i.test(message))) return;
        push({ id: crypto.randomUUID(), kind: error ? "error" : "success", message: message.slice(0, 300) });
      });
    };
    scan(true);
    const observer = new MutationObserver(() => scan());
    observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["role"] });
    return () => observer.disconnect();
  }, [push]);
  return <div data-admin-toasts className="pointer-events-none fixed bottom-20 right-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 md:bottom-6 md:right-6">
    {items.map(item => <div key={item.id} role={item.kind === "error" ? "alert" : "status"} className={`pointer-events-auto flex items-start gap-3 rounded-2xl border-2 bg-white p-4 shadow-lg ${item.kind === "error" ? "border-red-700 text-red-900" : "border-emerald-700 text-emerald-950"}`}>
      <span aria-hidden className="text-lg font-bold">{item.kind === "error" ? "!" : "✓"}</span>
      <p className="min-w-0 flex-1 text-sm font-semibold leading-relaxed">{item.message}</p>
      <button type="button" aria-label="Fermer la notification" onClick={() => setItems(current => current.filter(old => old.id !== item.id))} className="shrink-0 rounded-lg px-1 text-xl leading-none">×</button>
    </div>)}
  </div>;
}
