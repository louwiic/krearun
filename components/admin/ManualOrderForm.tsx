"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  saveManualOrderAction,
  type OrderActionResult,
} from "@/app/admin/order-actions";
import {
  PAYMENT_STATUSES,
  PRODUCTION_STATUSES,
  productionStatus,
} from "@/lib/order-management";
import type { Order } from "@/lib/types";

const field =
  "mt-1.5 w-full rounded-xl border border-sand bg-linen px-4 py-3 text-sm outline-none focus:border-terra disabled:opacity-60";
export default function ManualOrderForm({ order }: { order?: Order }) {
  const [state, setState] = useState<OrderActionResult>({});
  const [pending, startTransition] = useTransition();
  const [payment, setPayment] = useState(order?.paymentStatus ?? "unpaid");
  const web = order?.source === "web";
  const input = (
    name: string,
    label: string,
    value = "",
    type = "text",
    required = false,
    maxLength = 500,
  ) => (
    <label className="block text-sm font-semibold">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={value}
        required={required}
        maxLength={maxLength}
        className={field}
      />
    </label>
  );
  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={order ? `/admin/commandes/${order.id}` : "/admin/commandes"}
        className="text-sm text-ink-soft hover:text-terra"
      >
        ← Retour
      </Link>
      <h1 className="mb-2 mt-3 font-display text-3xl font-semibold">
        {order
          ? `Modifier la commande #${order.number}`
          : "Nouvelle commande manuelle"}
      </h1>
      <p className="mb-6 text-sm text-ink-soft">
        Aucun e-mail envoyé à l’enregistrement. Aucun produit du catalogue ni
        stock modifié.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          startTransition(async () => {
            try {
              setState(await saveManualOrderAction({}, data));
            } catch (error) {
              if (
                error instanceof Error &&
                error.message.includes("NEXT_REDIRECT")
              )
                throw error;
              setState({
                error:
                  "Enregistrement non confirmé. Vérifie la liste des commandes avant de réessayer.",
              });
            }
          });
        }}
        className="space-y-6"
      >
        <input type="hidden" name="id" value={order?.id ?? ""} />
        <input type="hidden" name="updatedAt" value={order?.updatedAt ?? ""} />
        <fieldset disabled={pending} className="space-y-6">
          <section className="rounded-2xl bg-cream p-6 shadow-soft">
            <h2 className="mb-4 font-display text-xl font-semibold">Client</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {input("name", "Nom du client *", order?.name, "text", true)}
              {input("phone", "Téléphone", order?.phone, "tel")}
              {input(
                "email",
                "E-mail (facultatif)",
                order?.email,
                "email",
                false,
                320,
              )}
              {input("city", "Ville / secteur", order?.city)}
              {input("addressLine1", "Adresse", order?.addressLine1)}
              {input(
                "addressLine2",
                "Complément d’adresse",
                order?.addressLine2,
              )}
              {input(
                "postalCode",
                "Code postal",
                order?.postalCode,
                "text",
                false,
                50,
              )}
              {input("country", "Pays", order?.country, "text", false, 100)}
            </div>
          </section>
          <section className="rounded-2xl bg-cream p-6 shadow-soft">
            <h2 className="mb-4 font-display text-xl font-semibold">
              Fabrication
            </h2>
            <label className="block text-sm font-semibold">
              Produits et détails de la commande
              <textarea
                name="description"
                defaultValue={order?.description}
                rows={5}
                maxLength={20000}
                className={field}
                placeholder="Ex. porte-canette Red Bull, bleu et rouge, prénom…"
              />
            </label>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {input(
                "quantityText",
                "Quantité / précisions",
                order?.quantityText,
              )}
              <label className="text-sm font-semibold">
                Production
                <select
                  name="status"
                  defaultValue={productionStatus(order?.status ?? "pending")}
                  className={field}
                >
                  {PRODUCTION_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>
              {input(
                "orderedAt",
                "Date de commande *",
                (order?.orderedAt || new Date().toISOString()).slice(0, 10),
                "date",
                true,
              )}
              {input(
                "dueDate",
                "Date prévue",
                order?.dueDate.slice(0, 10),
                "date",
              )}
              {input(
                "trackingNumber",
                "Numéro de suivi colis",
                order?.trackingNumber,
              )}
              {input(
                "tags",
                "Tags (séparés par des virgules)",
                order?.tags.join(", "),
                "text",
                false,
                2000,
              )}
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
              <input
                name="urgent"
                type="checkbox"
                defaultChecked={order?.urgent}
              />{" "}
              Commande urgente
            </label>
          </section>
          <section className="rounded-2xl bg-cream p-6 shadow-soft">
            <h2 className="mb-4 font-display text-xl font-semibold">
              Paiement
            </h2>
            {web && (
              <p className="mb-3 text-sm text-ink-soft">
                Commande boutique : les montants et paiements Stripe sont
                conservés. Ce formulaire ne déclenche ni paiement ni
                remboursement.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm font-semibold">
                Total (€)
                <input
                  name="total"
                  type="number"
                  min="0"
                  max="1000000"
                  step="0.01"
                  required
                  defaultValue={(order?.totalCents ?? 0) / 100}
                  disabled={web}
                  className={field}
                />
              </label>
              <label className="text-sm font-semibold">
                Paiement
                <select
                  name="paymentStatus"
                  value={payment}
                  onChange={(event) =>
                    setPayment(event.target.value as Order["paymentStatus"])
                  }
                  disabled={web}
                  className={field}
                >
                  {PAYMENT_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold">
                Acompte encaissé (€)
                <input
                  name="amountPaid"
                  type="number"
                  min="0"
                  max="1000000"
                  step="0.01"
                  defaultValue={(order?.amountPaidCents ?? 0) / 100}
                  disabled={web || payment !== "deposit"}
                  className={field}
                />
              </label>
            </div>
            <p className="mt-3 text-xs text-ink-soft">
              « Payé » comptabilise le total. « Acompte » utilise le montant
              saisi. Le reste à payer est calculé automatiquement. « Remboursé »
              est un suivi comptable manuel, sans mouvement bancaire.
            </p>
          </section>
          <section className="rounded-2xl bg-cream p-6 shadow-soft">
            <h2 className="mb-4 font-display text-xl font-semibold">
              Suivi interne
            </h2>
            <label className="text-sm font-semibold">
              Commentaires et relances (privés)
              <textarea
                name="internalNote"
                defaultValue={order?.internalNote}
                rows={5}
                maxLength={20000}
                className={field}
              />
            </label>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {input(
                "customerProfileUrl",
                "Lien du profil client",
                order?.customerProfileUrl,
                "url",
                false,
                2000,
              )}
              {input(
                "productUrl",
                "Lien du produit / modèle",
                order?.productUrl,
                "url",
                false,
                2000,
              )}
            </div>
          </section>
        </fieldset>
        {state.error && (
          <p role="alert" className="rounded-xl bg-blush/30 p-4 text-sm">
            {state.error}
          </p>
        )}
        <button
          disabled={pending}
          className="rounded-full bg-ink px-7 py-3 text-sm font-bold text-cream hover:bg-terra disabled:opacity-50"
        >
          {pending ? "Enregistrement…" : "Enregistrer la commande"}
        </button>
      </form>
    </div>
  );
}
