import Link from "next/link";
import { restoreReminderCart } from "@/lib/cart-reminder-service";
import RestoreReminderCart from "@/components/cart/RestoreReminderCart";
export const dynamic = "force-dynamic";
export default async function ResumePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const items = await restoreReminderCart(token);
  return <><h1 className="font-display text-3xl font-bold">Retrouver votre panier</h1>{items.length ? <RestoreReminderCart items={items} /> : <><p className="mt-4">Le lien a expiré, la demande a été annulée ou les articles ne sont plus disponibles.</p><Link href="/boutique" className="mt-5 inline-block underline">Retour à la boutique</Link></>}</>;
}
