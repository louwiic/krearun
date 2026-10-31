"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductPrintFile } from "@/lib/print-files";

export default function ProductPrintFiles({ productId, files, noelKit = false }: { productId: string; files: ProductPrintFile[]; noelKit?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true); setMessage(""); setError(false);
    try {
      const response = await fetch("/api/admin/print-files", { method: "POST", body: new FormData(form) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "L’envoi a échoué.");
      setMessage("3MF enregistré dans la fiche produit."); form.reset(); router.refresh();
    } catch (e) { setError(true); setMessage(e instanceof Error ? e.message : "L’envoi a échoué."); }
    finally { setBusy(false); }
  }
  return <section id="impression" className="mb-8 rounded-2xl border border-sand bg-cream p-6">
    <h2 className="font-display text-2xl font-semibold">Fichiers d’impression 3MF</h2>
    <p className="mt-2 text-sm text-ink-soft">Réservés à l’admin. Télécharge le projet, ouvre-le dans Bambu Studio, puis vérifie les plateaux et le filament avant de lancer l’impression.</p>
    {noelKit && <p className="mt-3 rounded-xl bg-linen p-3 text-sm leading-6"><strong>Kit avec plusieurs décorations :</strong> répète les plateaux des pièces et connecteurs pour chaque décoration du kit. Imprime un seul jeu de moules par kit complet commandé, quelle que soit la quantité de décorations choisie.</p>}
    <ul className="my-5 space-y-4">
      {files.map(file => <li key={file.id} className="min-w-0 rounded-xl border border-sand bg-white p-4">
        <p className="break-words font-semibold">{file.originalName.replaceAll("+", " ")}</p>
        <p className="mt-1 text-sm text-ink-soft">{(file.sizeBytes / 1024 / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo · Empreinte SHA-256 : {file.sha256.slice(0, 12)}…</p>
        {file.notes && <p className="my-3 whitespace-pre-line text-sm">{file.notes}</p>}
        <a href={`/api/admin/print-files/${file.id}`} className="mt-3 inline-block rounded-full bg-ink px-5 py-3 font-semibold text-white">Télécharger le 3MF pour Bambu Studio</a>
        {/^https:\/\/makerworld\.com\//.test(file.sourceUrl) && <a href={file.sourceUrl} target="_blank" rel="noreferrer" className="ml-4 inline-block py-3 text-sm underline">Fiche du créateur ↗</a>}
      </li>)}
    </ul>
    {!files.length && <p className="my-4 text-sm">Aucun fichier joint pour le moment.</p>}
    <form onSubmit={upload} className="space-y-3 border-t border-sand pt-4">
      <input type="hidden" name="productId" value={productId} />
      <label className="block font-semibold">Ajouter un projet 3MF (100 Mo maximum)
        <input type="file" name="file" accept=".3mf" required disabled={busy} className="mt-2 block w-full min-w-0 text-sm" />
      </label>
      <label className="block text-sm">Consignes d’impression (facultatif)
        <textarea name="notes" maxLength={10000} rows={3} className="mt-1 w-full rounded-xl border border-sand bg-white p-3" placeholder="Plateaux, pièces du kit, moules, filament…" />
      </label>
      <button disabled={busy} className="rounded-full bg-ink px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Envoi en cours…" : "Enregistrer le 3MF"}</button>
      {message && <p role={error ? "alert" : "status"} className={error ? "text-red-700" : "text-green-800"}>{message}</p>}
    </form>
  </section>;
}
