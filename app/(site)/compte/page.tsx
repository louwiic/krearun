import Link from "next/link";
import LoginForm from "./LoginForm";
import { customerLogoutAction } from "./actions";
import { getCustomerSession } from "@/lib/customer-auth";
import { getCustomerById, getOrdersByCustomerEmail, getHolderRequests } from "@/lib/store";
import HolderRequestCard from "@/components/custom-holder/HolderRequestCard";
import { formatDate, formatPrice } from "@/lib/format";
import StatusBadge from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

export default async function CustomerAccountPage({searchParams}:{searchParams:Promise<{personnalisation?:string}>}) {
  const session = await getCustomerSession();
  if (!session) {
    return <div className="mx-auto max-w-xl px-5 py-16 sm:px-8"><p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-terra">Espace client</p><h1 className="font-display text-4xl font-semibold">Mes commandes</h1><p className="mt-3 text-sm text-ink-soft">Connectez-vous pour retrouver vos commandes et vos informations.</p><LoginForm /></div>;
  }

  const [customer, orders, requests, search] = await Promise.all([
    getCustomerById(session.id),
    getOrdersByCustomerEmail(session.email),
    getHolderRequests(session.id),
    searchParams,
  ]);
  if (!customer) return <div className="mx-auto max-w-3xl px-5 py-16">Compte introuvable.</div>;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-terra">Espace client</p><h1 className="font-display text-4xl font-semibold">Bonjour {customer.name.split(" ")[0] || "à vous"}</h1></div>
        <form action={customerLogoutAction}><button className="text-sm font-bold text-ink-soft hover:text-terra">Se déconnecter</button></form>
      </div>
      {requests.length>0&&<section id="personnalisations" className="mt-8 scroll-mt-8"><h2 className="font-display text-2xl">Mes personnalisations</h2>{search.personnalisation==='payee'&&<p role="status" className="mt-3 rounded-xl bg-sage/20 p-4 text-sm">Le paiement est en cours de confirmation. Votre commande apparaîtra ici dès réception de la confirmation sécurisée.</p>}{search.personnalisation==='annulee'&&<p className="mt-3 text-sm">Vous pouvez reprendre le paiement de votre demande validée quand vous le souhaitez.</p>}<div className="mt-5 grid gap-4 lg:grid-cols-2">{requests.map(request=><HolderRequestCard key={request.id} request={request}/>)}</div></section>}
      <div id="commandes" className="mt-8 grid scroll-mt-8 gap-6 lg:grid-cols-[1fr_2fr]">
        <section className="h-fit bg-cream p-6 shadow-soft"><h2 className="font-display text-xl font-semibold">Mes coordonnées</h2><dl className="mt-5 space-y-3 text-sm"><div><dt className="text-ink-faint">E-mail</dt><dd className="font-semibold">{customer.email}</dd></div><div><dt className="text-ink-faint">Téléphone</dt><dd className="font-semibold">{customer.phone || "—"}</dd></div><div><dt className="text-ink-faint">Adresse</dt><dd className="font-semibold leading-6">{customer.addressLine1}{customer.addressLine2 && <><br />{customer.addressLine2}</>}<br />{customer.postalCode} {customer.city}</dd></div></dl></section>
        <section><h2 className="font-display text-2xl font-semibold">Mes commandes</h2>{orders.length === 0 ? <div className="mt-5 bg-cream p-8 text-center shadow-soft"><p>Aucune commande liée à ce compte.</p><Link href="/boutique" className="mt-4 inline-flex font-bold text-terra">Découvrir la boutique →</Link></div> : <div className="mt-5 space-y-4">{orders.map((order) => <article key={order.id} className="bg-cream p-5 shadow-soft"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-display text-xl font-semibold">Commande #{order.number}</p><p className="mt-1 text-xs text-ink-faint">{formatDate(order.createdAt)} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} article(s)</p></div><div className="text-right"><StatusBadge status={order.status} /><p className="mt-2 font-bold">{formatPrice(order.totalCents)}</p></div></div>{order.trackingNumber && <p className="mt-4 border-t border-sand/60 pt-4 text-sm">Suivi colis : <strong>{order.trackingNumber}</strong></p>}<Link href={`/suivi?commande=${order.number}&email=${encodeURIComponent(order.email)}`} className="mt-4 inline-flex text-sm font-bold text-terra hover:underline">Voir le détail et le suivi →</Link></article>)}</div>}</section>
      </div>
    </div>
  );
}
