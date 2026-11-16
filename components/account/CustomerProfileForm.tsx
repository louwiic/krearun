"use client";
import { useActionState } from "react";
import { saveCustomerProfileAction } from "@/app/(site)/compte/actions";
import type { Customer } from "@/lib/types";

export default function CustomerProfileForm({ customer }: { customer: Customer }) {
  const [state, action, pending] = useActionState(saveCustomerProfileAction, {});
  return <form action={action} className="mt-5 space-y-4">
    <p className="text-sm text-ink-soft">E-mail du compte : <strong className="break-all">{customer.email}</strong></p>
    <div className="grid gap-4 sm:grid-cols-2">
      {([
        ["name", "Nom complet", 150, "name"], ["phone", "Téléphone", 40, "tel"],
        ["addressLine1", "Adresse", 250, "address-line1"], ["addressLine2", "Complément d’adresse", 250, "address-line2"],
        ["postalCode", "Code postal", 5, "postal-code"], ["city", "Ville", 100, "address-level2"],
      ] as const).map(([name, label, maxLength, autoComplete]) => <label key={name} className="text-sm font-semibold">{label}<input name={name} defaultValue={customer[name]} required={name === "name"} maxLength={maxLength} autoComplete={autoComplete} className="mt-1.5 w-full rounded-xl border border-sand bg-linen px-4 py-3 outline-none focus:border-terra" /></label>)}
      <label className="text-sm font-semibold">Pays<select name="country" defaultValue={customer.country === "FR" ? "FR" : "RE"} autoComplete="country" className="mt-1.5 w-full rounded-xl border border-sand bg-linen px-4 py-3"><option value="RE">La Réunion</option><option value="FR">France métropolitaine</option></select></label>
    </div>
    {state.error && <p role="alert" className="text-sm text-terra-deep">{state.error}</p>}
    {state.success && <p role="status" className="text-sm">{state.success}</p>}
    <button disabled={pending} className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-cream disabled:opacity-50">{pending ? "Enregistrement…" : "Enregistrer mes coordonnées"}</button>
  </form>;
}
