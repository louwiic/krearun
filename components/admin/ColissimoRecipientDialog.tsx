"use client";

import { useActionState, useRef, useState } from "react";
import type { Order } from "@/lib/types";
import { colissimoRecipientErrors, formatColissimoRecipient, recipientFields, type ColissimoRecipient } from "@/lib/colissimo-address";
import { saveColissimoRecipientAction, type ColissimoRecipientState } from "@/app/admin/colissimo-actions";

type SavedRecipient = ColissimoRecipient & { updatedAt: string };
const fields = [
  ["name", "Nom complet", true], ["addressLine1", "Numéro et rue", true],
  ["addressLine2", "Complément d’adresse / lieu-dit", false], ["postalCode", "Code postal", true],
  ["city", "Ville", true], ["country", "Pays (code ISO : RE, FR…)", true],
  ["email", "E-mail", false], ["phone", "Téléphone", false],
] as const;

function RecipientForm({ order, onSaved, onClose }: { order: Order; onSaved: (recipient: SavedRecipient) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<ColissimoRecipient>(() => formatColissimoRecipient(order));
  const formatted = formatColissimoRecipient(draft);
  const errors = colissimoRecipientErrors(formatted);
  const [state, action, pending] = useActionState<ColissimoRecipientState, FormData>(async (previous, data) => {
    const result = await saveColissimoRecipientAction(previous, data);
    if (result.saved) onSaved(result.saved);
    return result;
  }, {});
  return <form action={action} className="space-y-5">
    <input type="hidden" name="id" value={order.id} /><input type="hidden" name="updatedAt" value={order.updatedAt} />
    {recipientFields.map((key) => <input key={key} type="hidden" name={key} value={draft[key]} />)}
    <p className="text-sm text-ink-soft">La mise en forme s’actualise automatiquement dans l’aperçu. Vérifiez les informations avant d’enregistrer l’adresse de livraison de cette commande.</p>
    {state.error && <p role="alert" className="rounded-xl bg-blush/35 p-3 text-sm text-terra-deep">{state.error}</p>}
    <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
      {fields.map(([key, label, required]) => <label key={key} className={`text-xs font-bold ${["name", "addressLine1", "addressLine2"].includes(key) ? "sm:col-span-2" : ""}`}>
        {label}{required && " *"}
        <input required={required} type={key === "email" ? "email" : key === "phone" ? "tel" : "text"} value={draft[key]}
          onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))}
          className="mt-1 w-full rounded-xl border border-sand bg-linen px-3 py-2 text-sm font-normal" />
        {["name", "addressLine1", "addressLine2", "city"].includes(key) && <span className={`mt-1 block font-normal ${formatted[key].length > 35 ? "text-terra-deep" : "text-ink-soft"}`}>{formatted[key].length} / 35 caractères après mise en forme</span>}
      </label>)}
    </fieldset>
    <div className="rounded-xl border border-sand bg-linen p-4 text-sm" aria-label="Aperçu de l’adresse Colissimo">
      <p className="mb-2 font-bold">Adresse qui sera utilisée pour Colissimo</p>
      <p className="whitespace-pre-wrap break-words">{[formatted.name, formatted.addressLine1, formatted.addressLine2, `${formatted.postalCode} ${formatted.city}`.trim(), formatted.country].filter(Boolean).join("\n")}</p>
      <p className="mt-3 text-xs text-ink-soft">Mise en forme uniquement : l’existence de l’adresse n’est pas vérifiée.</p>
    </div>
    {errors.length > 0 && <ul aria-label="Corrections nécessaires" className="list-disc space-y-1 pl-5 text-sm text-terra-deep">{errors.map((error) => <li key={error}>{error}</li>)}</ul>}
    <div className="flex flex-wrap justify-end gap-3">
      <button type="button" disabled={pending} onClick={onClose} className="rounded-full border border-sand px-5 py-3 text-sm font-bold">Annuler</button>
      <button disabled={pending || errors.length > 0} className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-cream disabled:opacity-40">{pending ? "Enregistrement…" : "Valider les coordonnées"}</button>
    </div>
  </form>;
}

export default function ColissimoRecipientDialog({ order, disabled, onSaved }: { order: Order; disabled: boolean; onSaved: (recipient: SavedRecipient) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => dialog.current?.close();
  return <>
    <button type="button" disabled={disabled} className="text-terra-deep underline disabled:opacity-40" onClick={() => { setOpen(true); dialog.current?.showModal(); }}>Corriger les coordonnées</button>
    <dialog ref={dialog} aria-labelledby="colissimo-recipient-title" className="m-auto max-h-[90dvh] w-[min(94vw,42rem)] overflow-y-auto rounded-2xl bg-cream p-5 text-ink shadow-soft backdrop:bg-black/40 sm:p-7" onClose={() => setOpen(false)}>
      <h2 id="colissimo-recipient-title" className="mb-4 font-display text-2xl font-semibold">Corriger les coordonnées Colissimo</h2>
      {open && <RecipientForm order={order} onClose={close} onSaved={(recipient) => { onSaved(recipient); close(); }} />}
    </dialog>
  </>;
}
