import { canConfirmReminder } from "@/lib/cart-reminders";
import { redirect } from "next/navigation";
import { cartReminderForToken, cancelCartReminder, confirmCartReminder } from "@/lib/cart-reminder-service";
export const dynamic = "force-dynamic";
export default async function ReminderPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ annuler?: string; resultat?: string }> }) {
  const { token } = await params;
  const query = await searchParams;
  const reminder = await cartReminderForToken(token);
  async function confirm() { "use server"; const ok = await confirmCartReminder(token); redirect(`/panier/rappel/${token}?resultat=${ok ? "confirme" : "indisponible"}`); }
  async function cancel() { "use server"; await cancelCartReminder(token); redirect(`/panier/rappel/${token}?resultat=annule`); }
  if (reminder?.status === "cancelled") return <><h1 className="font-display text-3xl font-bold">Rappel annulé</h1><p className="mt-4">Vous ne recevrez aucun autre rappel pour cette demande.</p></>;
  if (!reminder) return <><h1 className="font-display text-3xl font-bold">Lien expiré ou indisponible</h1><p className="mt-4">Votre demande n’est plus disponible.</p></>;
  if (query.annuler === "1") return <><h1 className="font-display text-3xl font-bold">Annuler le rappel panier</h1><p className="mt-4">Cette désinscription concerne uniquement le rappel de ce panier.</p><form action={cancel}><button className="mt-5 rounded-full bg-terra px-6 py-3 font-bold text-white">Confirmer le désabonnement</button></form></>;
  if (reminder.status === "purchased") return <><h1 className="font-display text-3xl font-bold">Votre achat est confirmé</h1><p className="mt-4">Le rappel de ce panier a été annulé.</p></>;
  if (reminder.status === "pending") return <><h1 className="font-display text-3xl font-bold">Votre rappel est confirmé</h1><p className="mt-4">Vous recevrez un seul rappel dans environ une heure si votre achat n’est pas confirmé. Vous pouvez annuler votre demande ci-dessous.</p><form action={cancel}><button className="mt-5 underline">Annuler mon rappel</button></form></>;
  if (!canConfirmReminder(reminder)) return <><h1 className="font-display text-3xl font-bold">Cette demande n’est plus à confirmer</h1><p className="mt-4">Le rappel a déjà été traité ou le délai de confirmation est dépassé.</p></>;
  return <><h1 className="font-display text-3xl font-bold">Confirmez votre rappel panier</h1><p className="mt-4">Recevez un seul email dans environ une heure pour reprendre votre panier, si votre achat n’est pas confirmé. Vous ne serez pas inscrit à la newsletter.</p><form action={confirm}><button className="mt-5 rounded-full bg-terra px-6 py-3 font-bold text-white">Confirmer mon rappel</button></form><form action={cancel}><button className="mt-4 underline">Annuler cette demande</button></form></>;
}
