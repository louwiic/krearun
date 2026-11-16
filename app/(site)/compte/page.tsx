import Link from "next/link";
import LoginForm from "./LoginForm";
import { customerLogoutAction } from "./actions";
import { getCustomerSession } from "@/lib/customer-auth";
import { getCustomerById, getOrdersByCustomerEmail, getHolderRequests } from "@/lib/store";
import HolderRequestCard from "@/components/custom-holder/HolderRequestCard";
import { formatDate, formatPrice } from "@/lib/format";
import StatusBadge from "@/components/admin/StatusBadge";
import CartRewards from "@/components/cart/CartRewards";
import CustomerProfileForm from "@/components/account/CustomerProfileForm";
import { REWARDS } from "@/lib/rewards";

export const dynamic = "force-dynamic";
const card = "rounded-3xl border border-sand/60 bg-cream p-5 shadow-soft sm:p-7";

export default async function CustomerAccountPage({searchParams}:{searchParams:Promise<{personnalisation?:string}>}) {
  const session = await getCustomerSession();
  if (!session) return <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
    <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-terra">Votre atelier personnel</p>
    <h1 className="font-display text-4xl font-semibold">Mon espace Kréarun</h1>
    <p className="mt-3 max-w-2xl text-sm text-ink-soft">Retrouvez vos commandes, suivez vos créations personnalisées et préparez votre prochain coup de cœur.</p>
    <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
      <section className={card}><h2 className="font-display text-2xl font-semibold">Se connecter</h2><LoginForm /></section>
      <div className="space-y-5"><CartRewards /><section className={card}><h2 className="font-display text-xl font-semibold">Tout retrouver au même endroit</h2><ul className="mt-4 space-y-3 text-sm text-ink-soft"><li>✦ Vos commandes et leur avancement</li><li>✦ Vos demandes de créations sur mesure</li><li>✦ Vos coordonnées modifiables</li><li>✦ Les récompenses disponibles pour votre panier</li></ul><p className="mt-4 text-xs text-ink-soft">Les récompenses sont accessibles aussi sans connexion. Leur sélection reste enregistrée sur cet appareil.</p></section></div>
    </div>
  </div>;

  const [customer, orders, requests, search] = await Promise.all([
    getCustomerById(session.id), getOrdersByCustomerEmail(session.email), getHolderRequests(session.id), searchParams,
  ]);
  if (!customer) return <div className="mx-auto max-w-3xl px-5 py-16">Compte introuvable.</div>;
  const activeOrders = orders.filter(order => !["delivered", "cancelled"].includes(order.status));
  const paidOrders = orders.filter(order => order.paymentStatus === "paid");
  return <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-terra">Mon espace Kréarun</p><h1 className="font-display text-4xl font-semibold">Bonjour {customer.name.split(" ")[0] || "à vous"}</h1><p className="mt-3 text-sm text-ink-soft">Vos créations, vos commandes et vos petites attentions.</p></div>
      <form action={customerLogoutAction}><button className="text-sm font-bold text-ink-soft hover:text-terra">Se déconnecter</button></form>
    </div>
    <nav aria-label="Rubriques de mon compte" className="mt-7 flex flex-wrap gap-2">
      {[["commandes","Mes commandes"],["recompenses","Mes récompenses"],["personnalisations","Mes personnalisations"],["coordonnees","Mes coordonnées"],["aide","Besoin d’aide"]].map(([id,label]) => <a key={id} href={`#${id}`} className="rounded-full border border-sand bg-cream px-4 py-2 text-sm font-semibold hover:border-terra">{label}</a>)}
    </nav>
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {[["Commandes",String(orders.length)],["En cours",String(activeOrders.length)],["Achats réglés",formatPrice(paidOrders.reduce((sum,order)=>sum+order.totalCents,0))]].map(([label,value]) => <div key={label} className="rounded-2xl bg-cream p-5"><p className="text-xs text-ink-soft">{label}</p><p className="mt-2 font-display text-2xl font-semibold">{value}</p></div>)}
    </div>
    <div className="mt-8 grid items-start gap-7 lg:grid-cols-[1fr_1.5fr]">
      <section id="recompenses" className="scroll-mt-6 space-y-4"><CartRewards /><div className={card}><h2 className="font-display text-xl font-semibold">Comment en profiter ?</h2><ol className="mt-4 list-inside list-decimal space-y-3 text-sm text-ink-soft"><li>Composez votre panier.</li><li>Sélectionnez une récompense éligible.</li><li>Retrouvez la réduction dans le total avant de payer.</li></ol><div className="mt-4 space-y-2 text-sm">{REWARDS.map(reward=><p key={reward.code}><strong>−{formatPrice(reward.amountCents)}</strong> · {reward.condition}</p>)}</div><p className="mt-3 text-xs text-ink-soft">Entre 18,01 € et 34,99 € d’articles, aucune de ces deux récompenses n’est applicable. Une seule réduction par commande ; les remises automatiques sur les quantités restent prises en compte.</p><Link href="/panier" className="mt-5 inline-flex text-sm font-bold text-terra">Voir mon panier →</Link></div></section>
      <section id="commandes" className="scroll-mt-6"><h2 className="font-display text-2xl font-semibold">Mes commandes</h2>
        {!orders.length ? <div className={`mt-5 ${card}`}><p>Aucune commande liée à ce compte.</p><Link href="/boutique" className="mt-4 inline-flex font-bold text-terra">Découvrir la boutique →</Link></div> : <div className="mt-5 space-y-4">{orders.map(order=><article key={order.id} className={card}>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-display text-xl font-semibold">Commande #{order.number}</h3><p className="mt-1 text-xs text-ink-faint">{formatDate(order.createdAt)} · {order.items.reduce((sum,item)=>sum+item.quantity,0)} article(s)</p></div><div className="text-right"><StatusBadge status={order.status}/><p className="mt-2 font-bold">{formatPrice(order.totalCents)}</p></div></div>
          <details className="mt-4 border-t border-sand/60 pt-3"><summary className="cursor-pointer text-sm font-semibold">Articles et personnalisations</summary><ul className="mt-3 space-y-3">{order.items.map((item,index)=><li key={index} className="rounded-xl bg-linen p-3 text-sm"><p className="font-semibold">{item.quantity} × {item.name}</p>{item.variantName&&<p>{item.variantName}</p>}<p className="mt-1 text-ink-soft">{item.color}</p>{item.customName&&<p className="mt-1 break-words text-ink-soft">Personnalisation : {item.customName}</p>}</li>)}</ul>{!order.items.length&&<p className="mt-3 whitespace-pre-line text-sm">{order.description || "Retrouvez les informations dans le suivi de votre commande."}</p>}<p className="mt-3 text-xs text-ink-soft">Pour modifier une création déjà commandée, contactez l’atelier avec le numéro de commande.</p></details>
          {order.trackingNumber&&<p className="mt-4 break-all text-sm">Suivi colis : <strong>{order.trackingNumber}</strong></p>}
          <Link href={`/suivi?commande=${order.number}&email=${encodeURIComponent(order.email)}`} className="mt-4 inline-flex text-sm font-bold text-terra hover:underline">Voir le détail et le suivi →</Link>
        </article>)}</div>}
      </section>
    </div>
    <section id="personnalisations" className={`mt-8 scroll-mt-6 ${card}`}><h2 className="font-display text-2xl font-semibold">Mes personnalisations</h2>
      {search.personnalisation==='payee'&&<p role="status" className="mt-3 rounded-xl bg-sage/20 p-4 text-sm">Le paiement est en cours de confirmation. Votre commande apparaîtra ici après confirmation sécurisée.</p>}
      {search.personnalisation==='annulee'&&<p className="mt-3 text-sm">Vous pouvez reprendre le paiement de votre demande validée quand vous le souhaitez.</p>}
      {requests.length ? <div className="mt-5 grid gap-4 lg:grid-cols-2">{requests.map(request=><HolderRequestCard key={request.id} request={request}/>)}</div> : <p className="mt-4 text-sm text-ink-soft">Aucune demande sur mesure en cours. Les personnalisations des produits déjà commandés figurent dans vos commandes.</p>}
      <Link href="/personnaliser" className="mt-5 inline-flex text-sm font-bold text-terra">Créer un nouvel objet personnalisé →</Link>
    </section>
    <section id="coordonnees" className={`mt-8 scroll-mt-6 ${card}`}><h2 className="font-display text-2xl font-semibold">Mes coordonnées</h2><p className="mt-2 text-xs text-ink-soft">Modifiez les informations de votre compte. Pour changer l’adresse d’une commande en cours, contactez directement l’atelier.</p><CustomerProfileForm customer={customer}/></section>
    <section id="aide" className={`mt-8 scroll-mt-6 ${card}`}><h2 className="font-display text-2xl font-semibold">On reste à votre écoute</h2><p className="mt-3 text-sm text-ink-soft">Une question sur une couleur, une personnalisation ou une livraison ? Précisez votre numéro de commande pour faciliter le suivi.</p><div className="mt-5 flex flex-wrap gap-4 text-sm font-bold text-terra"><Link href="/contact">Contacter l’atelier →</Link><Link href="/faq">Livraison et questions fréquentes →</Link><Link href="/confidentialite">Mes données personnelles →</Link></div></section>
  </div>;
}
