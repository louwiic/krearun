"use client";

import { useState } from "react";
import { normalizeOrderTrackingNumber } from "@/lib/order-tracking";
import { PRODUCTION_STATUSES } from "@/lib/order-management";
import type { Order } from "@/lib/types";

export type StatusChangeRequest =
  | { kind: "single"; order: Order; status: Order["status"] }
  | { kind: "bulk"; orders: Order[]; status: string };

export default function StatusChangeDialog({
  request,
  pending,
  onCancel,
  onConfirm,
}: {
  request: StatusChangeRequest;
  pending: boolean;
  onCancel: () => void;
  onConfirm: (notifyCustomer: boolean, trackingNumbers: Record<string, string>) => void;
}) {
  const orders = request.kind === "single" ? [request.order] : request.orders;
  const [trackingNumbers, setTrackingNumbers] = useState<Record<string, string>>(
    () => Object.fromEntries(orders.map(order => [order.id, order.trackingNumber || ""])),
  );
  const [trackingError, setTrackingError] = useState("");
  function confirm(notifyCustomer: boolean) {
    try {
      const normalized = request.status === "shipped"
        ? Object.fromEntries(orders.map(order => [order.id, normalizeOrderTrackingNumber(trackingNumbers[order.id] || "")]))
        : {};
      setTrackingError("");
      onConfirm(notifyCustomer, normalized);
    } catch (error) {
      setTrackingError(error instanceof Error ? error.message : "Vérifiez le numéro de suivi.");
    }
  }
  const label =
    PRODUCTION_STATUSES.find((status) => status.value === request.status)
      ?.label ?? request.status;
  const emailCount = orders.filter((order) => order.email.trim()).length;
  const plural = orders.length > 1;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/45 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-change-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-cream p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-terra">
              Nouveau statut · {label}
            </p>
            <h2
              id="status-change-title"
              className="mt-2 font-display text-2xl font-semibold"
            >
              Confirmer le changement de statut
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            aria-label="Fermer"
            className="rounded-lg border border-sand px-3 py-2 text-lg disabled:opacity-50"
          >
            ×
          </button>
        </div>
        <p className="mt-4 text-sm leading-6 text-ink-soft">
          {plural
            ? `${orders.length} commandes vont passer au statut « ${label} ». Souhaites-tu informer les clients par e-mail ?`
            : `La commande #${orders[0].number} de ${orders[0].name} va passer au statut « ${label} ». Souhaites-tu informer le client par e-mail ?`}
        </p>
        {request.status === "shipped" && (
          <fieldset className="mt-5 space-y-3">
            <legend className="text-sm font-semibold">Suivi Colissimo (facultatif)</legend>
            <p className="text-xs leading-5 text-ink-soft">Collez le numéro de colis : les espaces seront supprimés. Il sera enregistré et inclus dans l’e-mail si vous choisissez de l’envoyer.</p>
            {orders.map(order => (
              <label key={order.id} className="block text-sm font-semibold">
                {plural ? `Commande #${order.number} · ${order.name}` : "Numéro de suivi Colissimo"}
                <input
                  type="text"
                  value={trackingNumbers[order.id] || ""}
                  onChange={event => { setTrackingNumbers(current => ({ ...current, [order.id]: event.target.value })); setTrackingError(""); }}
                  placeholder="Ex. 9A 0093911006 1"
                  maxLength={100}
                  autoComplete="off"
                  spellCheck={false}
                  disabled={pending}
                  aria-invalid={!!trackingError}
                  aria-describedby={trackingError ? "status-tracking-error" : undefined}
                  className="mt-2 w-full rounded-xl border border-sand bg-white px-3 py-3 font-normal outline-none focus:border-terra disabled:opacity-50"
                />
              </label>
            ))}
            {trackingError && <p id="status-tracking-error" role="alert" className="text-sm text-red-800">{trackingError}</p>}
          </fieldset>
        )}
        {emailCount < orders.length && (
          <p className="mt-3 rounded-xl bg-linen px-4 py-3 text-sm text-ink-soft">
            {emailCount
              ? `${orders.length - emailCount} commande(s) n’ont pas d’adresse e-mail et seront uniquement mises à jour.`
              : "Aucune adresse e-mail client n’est renseignée pour cette sélection."}
          </p>
        )}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => confirm(false)}
            disabled={pending}
            className="rounded-full border border-sand bg-cream px-4 py-3 text-sm font-bold hover:bg-linen disabled:opacity-50"
          >
            {pending ? "Mise à jour…" : "Changer sans e-mail"}
          </button>
          <button
            type="button"
            onClick={() => confirm(true)}
            disabled={pending || emailCount === 0}
            className="rounded-full bg-ink px-4 py-3 text-sm font-bold text-cream hover:bg-terra disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending
              ? "Envoi…"
              : `Changer et envoyer l’e-mail${plural ? "s" : ""}`}
          </button>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="mt-4 w-full text-sm font-semibold text-ink-soft underline disabled:opacity-50"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

