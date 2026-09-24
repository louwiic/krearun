"use client";

import { useState } from "react";

export default function ReviewShareLink() {
  const [copied, setCopied] = useState(false);
  const url = "https://krearun.re/avis";
  return <div className="mb-8 rounded-blob bg-cream p-5 shadow-soft">
    <p className="text-sm font-bold">Lien à envoyer aux clients</p>
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <a href={url} target="_blank" rel="noopener noreferrer" className="break-all text-sm text-terra underline">{url}</a>
      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); } catch { setCopied(false); } }} className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-cream">{copied ? "Copié !" : "Copier le lien"}</button>
    </div>
  </div>;
}
