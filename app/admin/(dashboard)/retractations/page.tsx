import type { Metadata } from "next";
import { getWithdrawals } from "@/lib/store";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Rétractations · Admin" };
export default async function WithdrawalAdminPage() {
  const requests = await getWithdrawals();
  return <div className="mx-auto max-w-5xl"><h1 className="font-display text-3xl">Déclarations de rétractation</h1><p className="mt-3 text-sm text-ink-soft">Registre privé des déclarations reçues. Vérifiez la demande puis traitez le retour et le remboursement depuis les outils habituels.</p><div className="mt-8 space-y-5">{requests.map(r=><article key={r.id} className="rounded-2xl border border-sand bg-cream p-6"><p className="text-xs text-ink-soft">{r.id} · {new Date(r.receivedAt).toLocaleString("fr-FR", { timeZone: "Indian/Reunion" })} (La Réunion)</p><h2 className="mt-2 font-display text-xl">{r.name}</h2><a href={`mailto:${r.email}`} className="text-sm underline">{r.email}</a><p className="mt-3 whitespace-pre-wrap text-sm">{r.contract}</p>{r.address&&<p className="mt-3 whitespace-pre-wrap text-sm">{r.address}</p>}<p className="mt-4 text-xs text-ink-soft">Accusé par e-mail : {r.receiptSent?"envoyé":"non confirmé"} · Notification atelier : {r.notificationSent?"envoyée":"non confirmée"}</p></article>)}{requests.length===0&&<p className="text-sm text-ink-soft">Aucune déclaration reçue.</p>}</div></div>;
}
