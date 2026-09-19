"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { Order } from "@/lib/types";
import { COLISSIMO_PRODUCTS, colissimoCountry, type ColissimoAddress, type CustomsArticle, type ShipmentSummary } from "@/lib/colissimo";
import { createColissimoLabelAction, attachColissimoTrackingAction, recoverColissimoLabelAction } from "@/app/admin/colissimo-actions";

const field = "mt-1 w-full rounded-xl border border-sand bg-linen px-3 py-2 text-sm font-normal";
const button = "rounded-full bg-ink px-5 py-3 text-sm font-bold text-cream disabled:cursor-not-allowed disabled:opacity-40";
function RecoverLabel({ id }: { id: string }) {
  const [state, action, pending] = useActionState(recoverColissimoLabelAction, {});
  return <form action={action} className="mt-3"><input type="hidden" name="id" value={id} /><button disabled={pending} className={button}>Récupérer l’étiquette existante</button><p role="status" className="mt-2 text-sm">{state.error || state.message}</p></form>;
}
function AttachTracking({ id }: { id: string }) {
  const [state, action, pending] = useActionState(attachColissimoTrackingAction, {});
  return <form action={action} className="mt-3"><input type="hidden" name="id" value={id} /><button disabled={pending} className={button}>Rattacher le suivi</button><p role="status" className="mt-2 text-sm">{state.error || state.message}</p></form>;
}
export default function ColissimoPanel({ order, config, shipment, storageError, today }: {
  order: Order; config: { sender: ColissimoAddress; missing: string[]; live: boolean };
  shipment: ShipmentSummary | null; storageError: boolean; today: string;
}) {
  const [state, action, pending] = useActionState(createColissimoLabelAction, {});
  const crossBorder = colissimoCountry(order.country, order.postalCode) !== config.sender.countryCode;
  const [customs, setCustoms] = useState(crossBorder);
  const [articles, setArticles] = useState<CustomsArticle[]>(() => order.items.map((item) => ({
    description: item.name.slice(0, 64), quantity: item.quantity, weight: (item.weightGrams || 0) / 1000,
    value: item.priceCents / 100, hsCode: "", originCountry: "",
  })));
  const updateArticle = (index: number, patch: Partial<CustomsArticle>) => setArticles((current) => current.map((article, position) => position === index ? { ...article, ...patch } : article));
  return <section id="colissimo" className="rounded-blob bg-cream p-7 shadow-soft">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-2xl font-semibold">Expédier avec Colissimo</h2><span className="rounded-full bg-linen px-3 py-1 text-xs font-bold">{config.live ? "Affranchissement réel" : "Mode test · validation uniquement"}</span></div>
    {state.error && <p role="alert" className="mt-4 rounded-xl bg-blush/35 p-3 text-sm text-terra-deep">{state.error}</p>}
    {state.message && <p role="status" className="mt-4 rounded-xl bg-sage/20 p-3 text-sm text-sage-deep">{state.message}</p>}
    {shipment ? <div className="mt-4 text-sm">
      {shipment.state === "ready" ? <>
        <p className="font-semibold">Suivi : {shipment.parcelNumber}</p>
        <div className="mt-3 flex flex-wrap gap-3">{shipment.documents.map((document) => <a key={document} className="rounded-full border border-sand px-4 py-2 font-semibold" href={`/api/admin/colissimo/${order.id}/${document}`}>{document === "label" ? "Télécharger l’étiquette PDF" : document === "cn23" ? "Déclaration CN23" : "Document proforma"}</a>)}</div>
        <a className="mt-3 block text-terra-deep underline" target="_blank" rel="noopener noreferrer" href={`https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(shipment.parcelNumber)}`}>Consulter le suivi La Poste ↗</a>
        {order.trackingNumber !== shipment.parcelNumber && <AttachTracking id={order.id} />}
        <p className="mt-3 text-ink-soft">Lors du dépôt, choisissez « Expédiée » dans le bloc Production et cochez la notification client pour lui transmettre le suivi.</p>
      </> : <><p role="alert" className="text-terra-deep">Une demande est en cours ou son résultat est incertain. Rechargez la page. Si cet état persiste, vérifiez dans Colissimo la référence KR-{order.number} avant de reprendre : un nouvel affranchissement est bloqué pour éviter un doublon.</p><RecoverLabel id={order.id} /></>}
    </div> : <>
      {config.missing.length > 0 && <p className="mt-4 rounded-xl bg-linen p-4 text-sm">À configurer sur le serveur : {config.missing.join(", ")}. Les accès se récupèrent dans le profil Colissimo Box.</p>}
      {storageError && <p className="mt-3 text-sm text-terra-deep">Le stockage des étiquettes n’est pas disponible. La configuration du service doit être terminée.</p>}
      <div className="my-5 grid gap-4 text-sm sm:grid-cols-2">
        <div><p className="font-bold">Expéditeur</p><p>{config.sender.companyName}<br />{config.sender.line2}<br />{config.sender.zipCode} {config.sender.city} · {config.sender.countryCode}</p></div>
        <div><p className="font-bold">Destinataire</p><p>{order.name}<br />{order.addressLine1}<br />{order.addressLine2}{order.addressLine2 && <br />}{order.postalCode} {order.city} · {colissimoCountry(order.country, order.postalCode)}</p><Link href={`/admin/commandes/${order.id}/modifier`} className="text-terra-deep underline">Corriger les coordonnées</Link></div>
      </div>
      <form action={action}>
        <input type="hidden" name="id" value={order.id} /><input type="hidden" name="updatedAt" value={order.updatedAt} /><input type="hidden" name="articles" value={JSON.stringify(articles)} />
        <fieldset disabled={pending || !!config.missing.length || storageError || !!order.trackingNumber || ["cancelled", "shipped", "delivered"].includes(order.status)} className="space-y-4 disabled:opacity-60">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold">Service<select name="productCode" required defaultValue="" className={field}><option value="" disabled>Choisir le service du contrat</option>{COLISSIMO_PRODUCTS.map((product) => <option key={product.value} value={product.value}>{product.label} ({product.value})</option>)}</select></label>
            <label className="text-xs font-bold">Poids total emballé (kg)<input name="weight" required type="number" min="0.001" max="30" step="0.001" className={field} placeholder="Ex. 0,500" /></label>
            <label className="text-xs font-bold">Date de dépôt prévue<input name="depositDate" type="date" required min={today} defaultValue={today} className={field} /></label>
            <label className="text-xs font-bold">Format d’impression<select name="format" className={field}><option value="PDF_A4_300dpi">PDF A4</option><option value="PDF_10x15_300dpi">PDF 10 × 15 cm</option></select></label>
          </div>
          <p className="text-xs text-ink-soft">Le service doit être disponible pour votre contrat, votre lieu de départ et la destination. Colissimo vérifie ces paramètres avant la création.</p>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="customs" checked={customs || crossBorder} disabled={crossBorder} onChange={(event) => setCustoms(event.target.checked)} />Déclaration douanière CN23 {crossBorder && "(requise pour cet envoi)"}</label>
          {(customs || crossBorder) && <div className="space-y-4 rounded-xl border border-sand p-4">
            <p className="text-xs text-ink-soft">Vérifiez chaque article et sa valeur déclarée après réduction. Indiquez les poids et valeurs unitaires, le code douanier et le pays de fabrication. La déclaration sera de type « vente de marchandises ». En cas de non-livraison, le retour payant sera demandé.</p>
            {articles.map((article, index) => <div key={index} className="grid gap-3 border-b border-sand pb-4 sm:grid-cols-2">
              <label className="text-xs font-bold sm:col-span-2">Description de l’article<input required maxLength={64} value={article.description} onChange={(event) => updateArticle(index, { description: event.target.value })} className={field} /></label>
              <label className="text-xs font-bold">Quantité<input required type="number" min="1" step="1" value={article.quantity || ""} onChange={(event) => updateArticle(index, { quantity: Number(event.target.value) })} className={field} /></label>
              <label className="text-xs font-bold">Poids unitaire (kg)<input required type="number" min="0.001" step="0.001" value={article.weight || ""} onChange={(event) => updateArticle(index, { weight: Number(event.target.value) })} className={field} /></label>
              <label className="text-xs font-bold">Valeur unitaire (€)<input required type="number" min="0.01" step="0.01" value={article.value || ""} onChange={(event) => updateArticle(index, { value: Number(event.target.value) })} className={field} /></label>
              <label className="text-xs font-bold">Code douanier HS<input required pattern="[0-9]{6}|[0-9]{8}|[0-9]{10}" value={article.hsCode} onChange={(event) => updateArticle(index, { hsCode: event.target.value })} className={field} /></label>
              <label className="text-xs font-bold">Pays de fabrication (ISO)<input required pattern="[A-Za-z]{2}" maxLength={2} placeholder="Ex. FR" value={article.originCountry} onChange={(event) => updateArticle(index, { originCountry: event.target.value.toUpperCase() })} className={field} /></label>
              <button type="button" onClick={() => setArticles((current) => current.filter((_, position) => position !== index))} className="self-end py-2 text-xs text-terra-deep underline">Retirer cet article</button>
            </div>)}
            <button type="button" disabled={articles.length >= 100} onClick={() => setArticles((current) => [...current, { description: "", quantity: 1, weight: 0, value: 0, hsCode: "", originCountry: "" }])} className="text-sm font-bold text-terra-deep">+ Ajouter un article</button>
            <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold">Référence de facture<input name="invoiceNumber" required maxLength={35} className={field} /></label><label className="text-xs font-bold">Frais de transport à déclarer (€)<input name="postage" type="number" min="0" max="10000" step="0.01" required defaultValue={order.shippingCents / 100} className={field} /></label></div>
          </div>}
          {config.live && <label className="flex items-start gap-2 text-sm"><input name="confirm" type="checkbox" required className="mt-1" />Je confirme les coordonnées et le poids, et souhaite créer l’affranchissement réel selon mon contrat Colissimo.</label>}
          <button className={button}>{pending ? "Traitement Colissimo…" : config.live ? "Créer l’étiquette Colissimo" : "Tester avec Colissimo"}</button>
          <p className="text-xs text-ink-soft">{config.live ? "Le suivi sera enregistré. Le statut et la notification client se gèrent ensuite dans le bloc Production." : "Ce test vérifie les données auprès de Colissimo sans créer d’étiquette ni affranchir de colis."}</p>
        </fieldset>
        {order.trackingNumber && <p className="mt-3 text-sm text-ink-soft">Un numéro de suivi est déjà associé à cette commande.</p>}
      </form>
    </>}
  </section>;
}
