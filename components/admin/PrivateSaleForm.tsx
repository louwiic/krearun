"use client";

import { useActionState } from "react";
import { createPrivateSaleAction } from "@/app/admin/(dashboard)/produits/sur-mesure/actions";

export function PrivateSaleForm() {
  const [state, action, pending] = useActionState(createPrivateSaleAction, { error: "" });
  const input = "mt-2 w-full rounded-xl border border-sand bg-white px-4 py-3 font-normal";
  return <form action={action} className="space-y-6 rounded-3xl border border-sand bg-white p-6 sm:p-8">
    <label className="block text-sm font-semibold">Nom de la création
      <input name="name" required maxLength={150} placeholder="Ex. Porte-boisson personnalisé pour Camille" className={input} />
    </label>
    <label className="block text-sm font-semibold">Détail de la demande du client
      <textarea name="description" required maxLength={10000} rows={5} placeholder="Dimensions, couleurs, texte, personnalisation et délai convenus…" className={input} />
    </label>
    <div className="grid gap-5 sm:grid-cols-3">
      <label className="block text-sm font-semibold">Prix unitaire (€)
        <input name="price" type="number" inputMode="decimal" min="0.01" max="99999.99" step="0.01" required className={input} />
      </label>
      <label className="block text-sm font-semibold">Quantité disponible
        <input name="stock" type="number" min="1" max="10000" step="1" defaultValue={1} required className={input} />
      </label>
      <label className="block text-sm font-semibold">Poids emballé (g)
        <input name="weightGrams" type="number" min="1" max="30000" step="1" required className={input} />
      </label>
    </div>
    <p className="text-sm text-ink-soft">Le prix est celui d’un exemplaire. La livraison sera calculée au panier selon le poids et la destination. Vous pourrez ajouter des photos et copier le lien à l’étape suivante.</p>
    {state.error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{state.error}</p>}
    <button disabled={pending} className="rounded-full bg-ink px-7 py-3 font-semibold text-white disabled:opacity-50">{pending ? "Création en cours…" : "Créer l’offre et obtenir le lien"}</button>
  </form>;
}
