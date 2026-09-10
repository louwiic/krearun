"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { selectReadyAddressLabels, type AddressLabelIssue } from "@/lib/address-labels";
import type { Order } from "@/lib/types";

type Preview = { url: string; count: number; pages: number; issues: AddressLabelIssue[] };

export default function AddressLabelsButton({ orders, disabled = false }: { orders: Order[]; disabled?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const generation = useRef(0);
  const objectUrl = useRef("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const readyCount = orders.filter((order) => order.status === "ready").length;

  useEffect(() => () => {
    generation.current += 1;
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);

  function clearPreview() {
    generation.current += 1;
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = "";
    setPreview(null);
    setBusy(false);
    setError("");
  }

  async function generate() {
    clearPreview();
    const current = generation.current;
    dialog.current?.showModal();
    setBusy(true);
    try {
      const selection = selectReadyAddressLabels(orders);
      const { generateAddressLabelsPdf } = await import("@/lib/address-labels-pdf");
      const result = await generateAddressLabelsPdf(selection.labels);
      if (current !== generation.current) return;
      const url = result.bytes
        ? URL.createObjectURL(new Blob([new Uint8Array(result.bytes)], { type: "application/pdf" }))
        : "";
      objectUrl.current = url;
      setPreview({
        url, count: result.count, pages: result.pages,
        issues: [...selection.issues, ...result.issues],
      });
    } catch {
      if (current === generation.current) {
        setError("Impossible de générer la planche. Ferme cette fenêtre puis réessaie. Aucune commande n’a été modifiée.");
      }
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={generate}
        disabled={disabled || busy || !readyCount}
        title="Toutes les commandes Prêt, indépendamment des filtres et de la pagination"
        className="rounded-full border border-sand bg-cream px-5 py-3 text-sm font-semibold hover:bg-linen disabled:cursor-not-allowed disabled:opacity-50"
      >
        Générer planche adresses · Prêt ({readyCount})
      </button>
      <dialog
        ref={dialog}
        className="crm-modal crm-surface"
        aria-labelledby="address-labels-title"
        onClose={clearPreview}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div className="crm-modal-box max-h-[94dvh] w-[min(96vw,68rem)] max-w-none overflow-y-auto rounded-2xl bg-cream p-0 text-ink">
          <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-sand bg-cream p-5">
            <div>
              <h2 id="address-labels-title" className="font-display text-2xl font-semibold">Planche adresses · Commandes Prêt</h2>
              <p className="mt-2 text-sm text-ink-soft">
                Toutes les dates et toutes les pages, sans tenir compte des filtres ni des cases cochées.
              </p>
            </div>
            <button type="button" autoFocus onClick={() => dialog.current?.close()}
              className="rounded-full border border-sand px-4 py-2 text-sm font-semibold hover:bg-linen"
              aria-label="Fermer la planche adresses">Fermer ×</button>
          </header>
          <div className="space-y-4 p-5" aria-busy={busy}>
            <p className="text-sm">A4 portrait · 8 étiquettes de 92,5 × 60 mm par page · Impression à 100 % (taille réelle). Découpe le long des cadres pointillés.</p>
            <p className="text-xs text-ink-soft">Adresses uniquement, sans affranchissement. La génération ne change pas les statuts et n’envoie aucun message aux clients.</p>
            {busy && <p role="status" className="rounded-xl bg-linen p-4 text-sm">Génération du PDF…</p>}
            {error && <p role="alert" className="rounded-xl bg-blush/30 p-4 text-sm">{error}</p>}
            {preview && (
              <>
                <p role="status" className="text-sm font-semibold">
                  {preview.count} adresse(s) imprimable(s) · {preview.pages} page(s)
                  {preview.issues.length > 0 && ` · ${preview.issues.length} commande(s) exclue(s), à corriger`}
                </p>
                {preview.issues.length > 0 && (
                  <details open className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm">
                    <summary className="cursor-pointer font-semibold">Adresses à corriger — non incluses dans le PDF</summary>
                    <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto">
                      {preview.issues.map((issue) => (
                        <li key={issue.id}>
                          <Link href={`/admin/commandes/${issue.id}/modifier`} className="font-semibold underline">
                            #{issue.number} · {issue.name || "Nom à renseigner"} — Corriger
                          </Link>
                          <p>{issue.reason}</p>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                {preview.url ? (
                  <>
                    <div className="flex flex-wrap gap-3 text-sm font-semibold">
                      <a href={preview.url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-ink px-5 py-3 text-cream hover:bg-terra">Ouvrir le PDF / Imprimer ↗</a>
                      <a href={preview.url} download="krearun-planche-adresses-pret.pdf" className="rounded-full border border-sand px-5 py-3 hover:bg-linen">Télécharger le PDF</a>
                    </div>
                    <iframe src={preview.url} title="Aperçu PDF des étiquettes adresses des commandes prêtes" className="h-[65dvh] w-full rounded-xl border border-sand bg-white" />
                    <p className="text-xs text-ink-soft">Si l’aperçu ne s’affiche pas, utilise « Ouvrir le PDF / Imprimer » ou télécharge le fichier.</p>
                  </>
                ) : <p className="rounded-xl bg-linen p-4 text-sm">Aucune adresse complète à imprimer. Complète les coordonnées des commandes Prêt, puis génère une nouvelle planche.</p>}
              </>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
