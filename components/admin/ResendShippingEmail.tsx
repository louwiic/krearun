"use client";

import { useActionState } from "react";
import { resendOrderShippedAction, type SendOrderEmailResult } from "@/app/admin/actions";
import type { Order } from "@/lib/types";

const initialState: SendOrderEmailResult = {};

export default function ResendShippingEmail({ order }: { order: Order }) {
  const [state, action, pending] = useActionState(resendOrderShippedAction, initialState);
  if (order.status !== "shipped") return null;

  return (
    <form
      action={action}
      className="mt-5 space-y-2"
      onSubmit={(event) => {
        if (pending || !window.confirm(`Renvoyer l’e-mail d’expédition de la commande #${order.number} à ${order.email} ?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={order.id} />
      <button
        type="submit"
        disabled={pending || !order.email}
        className="inline-flex items-center gap-2 rounded-full border border-sand px-4 py-2 text-sm font-semibold hover:bg-linen disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Envoi en cours…" : "Renvoyer l’e-mail d’expédition"}
      </button>
      {!order.email && <p className="text-sm text-ink-soft">Aucune adresse e-mail enregistrée.</p>}
      <p aria-live="polite" className={`text-sm ${state.error ? "text-red-700" : "text-green-700"}`}>
        {state.error || state.success || ""}
      </p>
    </form>
  );
}
