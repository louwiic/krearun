"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import type { Order } from "@/lib/types";
import {
  ORDER_SOURCES,
  PAYMENT_STATUSES,
  PRODUCTION_STATUSES,
  productionStatus,
  publicHttpUrl,
  remainingCents,
} from "@/lib/order-management";
import {
  paymentStatusStyle,
  productionStatusStyle,
} from "@/lib/order-status-style";
import { formatOrderDate } from "@/lib/order-details";
import { formatPrice } from "@/lib/format";
import OrderItems from "./OrderItems";

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-ink-soft">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm">
        {children || "—"}
      </dd>
    </div>
  );
}

export default function OrderDetailsDialog({
  order,
  onClose,
}: {
  order: Order | null;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (order && !element.open) element.showModal();
    if (!order && element.open) element.close();
  }, [order]);

  const profile = publicHttpUrl(order?.customerProfileUrl);
  const product = publicHttpUrl(order?.productUrl);
  return (
    <dialog
      ref={dialog}
      className="crm-modal crm-surface"
      aria-labelledby="order-details-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current?.close();
      }}
    >
      <div className="crm-modal-box max-h-[90dvh] w-[min(96vw,72rem)] max-w-none overflow-y-auto rounded-2xl bg-cream p-0 text-ink">
        {order && (
          <>
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-sand bg-cream p-5 sm:p-6">
              <div>
                <h2
                  id="order-details-title"
                  tabIndex={-1}
                  className="font-display text-2xl font-semibold"
                >
                  Tous les détails · Commande #{order.number}
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  {order.name || "Client à renseigner"} ·{" "}
                  {formatOrderDate(order.orderedAt, true)} · heure de La Réunion
                </p>
              </div>
              <button
                type="button"
                autoFocus
                onClick={() => dialog.current?.close()}
                className="rounded-full border border-sand px-4 py-2 text-sm font-semibold hover:bg-linen"
                aria-label="Fermer les détails de la commande"
              >
                Fermer ×
              </button>
            </header>
            <div className="space-y-6 p-5 sm:p-6">
              <div className="flex flex-wrap gap-2 text-sm font-semibold">
                <span
                  className={`rounded-full border px-3 py-1 ${productionStatusStyle(order.status)}`}
                >
                  {
                    PRODUCTION_STATUSES.find(
                      (s) => s.value === productionStatus(order.status),
                    )?.label
                  }
                </span>
                <span
                  className={`rounded-full border px-3 py-1 ${paymentStatusStyle(order.paymentStatus)}`}
                >
                  {
                    PAYMENT_STATUSES.find(
                      (s) => s.value === order.paymentStatus,
                    )?.label
                  }
                </span>
                {order.urgent && (
                  <span className="rounded-full bg-blush px-3 py-1">
                    Urgent
                  </span>
                )}
                {order.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-sand px-3 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <section className="min-w-0 rounded-xl border border-sand p-5">
                  <h3 className="mb-4 font-display text-xl">
                    Articles et personnalisation
                  </h3>
                  {order.description && (
                    <p className="mb-4 whitespace-pre-wrap break-words text-sm">
                      {order.description}
                    </p>
                  )}
                  {order.quantityText && (
                    <p className="mb-4 text-sm font-semibold">
                      Quantité / précisions : {order.quantityText}
                    </p>
                  )}
                  <OrderItems items={order.items} />
                  {!order.items.length && !order.description && (
                    <p className="text-sm text-ink-soft">
                      Aucun détail produit enregistré.
                    </p>
                  )}
                </section>
                <div className="min-w-0 space-y-6">
                  <section className="rounded-xl border border-sand p-5">
                    <h3 className="mb-4 font-display text-xl">
                      Client et livraison
                    </h3>
                    <dl className="grid gap-4 sm:grid-cols-2">
                      <Detail label="Client">{order.name}</Detail>
                      <Detail label="Téléphone">{order.phone}</Detail>
                      <Detail label="E-mail">{order.email}</Detail>
                      <Detail label="Ville / secteur">{order.city}</Detail>
                      <Detail label="Adresse">
                        {[
                          order.addressLine1,
                          order.addressLine2,
                          `${order.postalCode} ${order.city}`.trim(),
                          order.country,
                        ]
                          .filter(Boolean)
                          .join("\n")}
                      </Detail>
                      <Detail label="Suivi colis">
                        {order.trackingNumber}
                      </Detail>
                    </dl>
                  </section>
                  <section className="rounded-xl border border-sand p-5">
                    <h3 className="mb-4 font-display text-xl">
                      Montants et paiement
                    </h3>
                    <dl className="grid gap-4 sm:grid-cols-2">
                      <Detail label="Sous-total">
                        {formatPrice(order.subtotalCents)}
                      </Detail>
                      <Detail label="Livraison">
                        {formatPrice(order.shippingCents)}
                      </Detail>
                      <Detail label="Total">
                        {formatPrice(order.totalCents)}
                      </Detail>
                      <Detail label="Encaissé">
                        {formatPrice(order.amountPaidCents)}
                      </Detail>
                      <Detail label="Reste à payer">
                        {formatPrice(remainingCents(order))}
                      </Detail>
                      <Detail label="Gestion du paiement">
                        {order.source === "web"
                          ? "Stripe — lecture seule"
                          : "Commande manuelle"}
                      </Detail>
                    </dl>
                  </section>
                </div>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <section className="min-w-0 rounded-xl border border-sand p-5">
                  <h3 className="mb-3 font-display text-xl">Note du client</h3>
                  <p className="whitespace-pre-wrap break-words text-sm">
                    {order.note || "Aucune note client."}
                  </p>
                </section>
                <section className="min-w-0 rounded-xl border border-sand bg-linen p-5">
                  <h3 className="mb-3 font-display text-xl">
                    Notes internes · privé
                  </h3>
                  <p className="whitespace-pre-wrap break-words text-sm">
                    {order.internalNote || "Aucune note interne."}
                  </p>
                </section>
              </div>
              <section className="rounded-xl border border-sand p-5">
                <h3 className="mb-4 font-display text-xl">
                  Dates et références
                </h3>
                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Detail label="Origine">
                    {
                      ORDER_SOURCES.find(
                        (source) => source.value === order.source,
                      )?.label
                    }
                  </Detail>
                  <Detail label="Date de commande">
                    {formatOrderDate(order.orderedAt, true)}
                  </Detail>
                  <Detail label="Échéance">
                    {formatOrderDate(order.dueDate, true)}
                  </Detail>
                  <Detail label="Création dans Krearun">
                    {formatOrderDate(order.createdAt, true)}
                  </Detail>
                  <Detail label="Dernière modification">
                    {formatOrderDate(order.updatedAt, true)}
                  </Detail>
                  <Detail label="Identifiant d’origine">
                    {order.sourceId}
                  </Detail>
                  <Detail label="Identifiant Krearun">{order.id}</Detail>
                  {order.stripeSessionId && (
                    <Detail label="Session Stripe">
                      {order.stripeSessionId}
                    </Detail>
                  )}
                </dl>
                <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-terra-deep">
                  {profile && (
                    <a
                      href={profile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Profil client ↗
                    </a>
                  )}
                  {product && (
                    <a
                      href={product}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Produit / modèle ↗
                    </a>
                  )}
                </div>
              </section>
            </div>
            <footer className="flex flex-wrap justify-end gap-3 border-t border-sand bg-cream p-5 sm:p-6">
              <Link
                href={`/admin/commandes/${order.id}`}
                className="rounded-full border border-sand px-4 py-2 text-sm font-semibold"
              >
                Ouvrir la fiche complète
              </Link>
              <Link
                href={`/admin/commandes/${order.id}/modifier`}
                className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cream"
              >
                Modifier la commande
              </Link>
            </footer>
          </>
        )}
      </div>
    </dialog>
  );
}
