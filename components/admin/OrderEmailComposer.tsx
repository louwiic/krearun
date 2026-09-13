"use client";

import { useActionState } from "react";
import {
  sendOrderEmailAction,
  type SendOrderEmailResult,
} from "@/app/admin/actions";
import type { Order } from "@/lib/types";

const initialState: SendOrderEmailResult = {};

export default function OrderEmailComposer({ order }: { order: Order }) {
  const [state, formAction, pending] = useActionState(
    sendOrderEmailAction,
    initialState,
  );
  const firstName = order.name.trim().split(/\s+/)[0] || "";

  return (
    <details className="rounded-xl border border-sand bg-cream p-5">
      <summary className="cursor-pointer font-display text-xl">
        Envoyer un e-mail au client
      </summary>
      <form action={formAction} className="mt-5 space-y-4">
        <input type="hidden" name="id" value={order.id} />
        <p className="text-sm text-ink-soft">
          Destinataire : <strong className="text-ink">{order.email || "Aucune adresse"}</strong>
        </p>
        <label className="block text-sm font-semibold">
          Objet
          <input
            name="subject"
            required
            minLength={3}
            maxLength={160}
            defaultValue={`À propos de votre commande #${order.number} — Krearun Studio`}
            className="mt-1.5 w-full rounded-xl border border-sand bg-linen px-4 py-3 font-normal outline-none focus:border-terra"
          />
        </label>
        <label className="block text-sm font-semibold">
          Message
          <textarea
            name="message"
            required
            maxLength={5000}
            rows={7}
            defaultValue={`Bonjour${firstName ? ` ${firstName}` : ""},\n\n`}
            className="mt-1.5 w-full resize-y rounded-xl border border-sand bg-linen px-4 py-3 font-normal outline-none focus:border-terra"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending || !order.email}
            className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-cream transition-colors hover:bg-terra disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Envoi en cours…" : "Envoyer l’e-mail"}
          </button>
          <p aria-live="polite" className={`text-sm ${state.error ? "text-red-700" : "text-green-700"}`}>
            {state.error || state.success || ""}
          </p>
        </div>
        <p className="text-xs text-ink-faint">
          Le client pourra répondre directement à l’adresse de contact Krearun.
        </p>
      </form>
    </details>
  );
}
