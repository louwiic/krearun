"use client";

import { useActionState } from "react";
import { sendPromotionCodeAction } from "@/app/admin/(dashboard)/codes-promo/actions";

export default function PromotionEmailForm({ id, code, discount, conditions, usable }: {
  id: string; code: string; discount: string; conditions: string[]; usable: boolean;
}) {
  const [state, action, pending] = useActionState(sendPromotionCodeAction, { success: false, message: "" });
  const field = "w-full rounded-2xl border border-sand bg-linen px-4 py-3 text-sm outline-none focus:border-terra";
  return (
    <details className="mt-5 border-t border-sand/70 pt-4">
      <summary className="cursor-pointer text-sm font-bold text-terra">Envoyer à un client</summary>
      <form action={action} className="mt-4 grid gap-4">
        <input type="hidden" name="id" value={id} />
        <label className="grid gap-1.5 text-xs font-bold text-ink-soft">
          Email du client
          <input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="client@exemple.fr" className={field} />
        </label>
        <label className="grid gap-1.5 text-xs font-bold text-ink-soft">
          Message personnalisé (facultatif)
          <textarea name="message" maxLength={2000} rows={3} placeholder="Un petit cadeau pour vous remercier…" className={field} />
        </label>
        <div className="rounded-2xl bg-linen p-4 text-xs leading-relaxed text-ink-soft">
          <p className="font-bold">Inclus dans l’email : {code} · − {discount}</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">{conditions.map((condition) => <li key={condition}>{condition}</li>)}</ul>
          <p className="mt-2">Les conditions seront actualisées au moment de l’envoi. L’envoi ne réserve pas le code à ce destinataire.</p>
        </div>
        {!usable && <p className="text-xs text-terra-deep">Ce code n’est plus utilisable et ne peut pas être envoyé.</p>}
        {state.message && <p role={state.success ? "status" : "alert"} className={`text-sm ${state.success ? "text-sage-deep" : "text-terra-deep"}`}>{state.message}</p>}
        <button disabled={pending || !usable} className="rounded-full bg-terra px-5 py-3 text-sm font-bold text-cream hover:bg-terra-deep disabled:cursor-not-allowed disabled:opacity-40">
          {pending ? "Envoi en cours…" : "Envoyer le code par email"}
        </button>
      </form>
    </details>
  );
}
