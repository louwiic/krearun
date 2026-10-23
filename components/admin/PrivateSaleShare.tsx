"use client";

import { useState } from "react";

export function PrivateSaleShare({ slug, active }: { slug: string; active: boolean }) {
  const [notice, setNotice] = useState("");
  const path = `/boutique/${slug}`;
  async function copy() {
    const url = new URL(path, window.location.origin).href;
    try { await navigator.clipboard.writeText(url); setNotice("Lien copié."); }
    catch { setNotice(`Copiez ce lien : ${url}`); }
  }
  return <section className="mb-8 rounded-3xl border border-ink bg-sky/15 p-6">
    <h2 className="font-display text-xl font-semibold">Lien de l’offre sur mesure</h2>
    <p className="mt-2 text-sm text-ink-soft">Hors catalogue. Partagez le lien au client pour qu’il commande et paie sur le site. Décochez « Disponible à la commande » pour fermer l’offre.</p>
    <p className="mt-2 text-sm font-semibold">{active ? "Offre active" : "Offre désactivée : le lien ne permet plus de commander"}</p>
    <div className="mt-4 flex flex-wrap items-center gap-4">
      <button type="button" onClick={copy} disabled={!active} className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white disabled:opacity-40">Copier le lien client</button>
      <a href={path} target="_blank" rel="noreferrer" className="text-sm font-semibold underline">Voir l’offre ↗</a>
    </div>
    <p role="status" className="mt-3 break-all text-sm">{notice}</p>
  </section>;
}
