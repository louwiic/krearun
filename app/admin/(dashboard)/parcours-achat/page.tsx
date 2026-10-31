import Link from "next/link";
import { getOrders, getProducts, getPurchaseEvents } from "@/lib/store";
import { JOURNEY_LABELS, JOURNEY_PAGES, purchaseJourneys } from "@/lib/purchase-journey";
import { formatPrice } from "@/lib/format";
import { productDay, shiftProductDay } from "@/lib/product-events";
export const dynamic = "force-dynamic";
const statuses: Record<string,string> = { browsing: "Navigation", active_cart: "Panier en cours", abandoned: "Panier en attente", paid: "Achat confirmé" };
const date = (value:string) => new Date(value).toLocaleString("fr-FR",{timeZone:"Indian/Reunion",day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
const field = "rounded-xl border border-sand bg-white px-3 py-2 text-sm";
export default async function PurchaseJourneyPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const query = await searchParams;
  const today = productDay(); const min = shiftProductDay(today,-29);
  const validDay = (v: string | undefined) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v;
  const requestedStart = /^\d{4}-\d{2}-\d{2}$/.test(query.debut || "") ? (query.debut! < min ? min : query.debut!) : shiftProductDay(today,-6);
  const start = validDay(requestedStart) && requestedStart <= today ? requestedStart : shiftProductDay(today,-6);
  const end = validDay(query.fin) && query.fin! >= start && query.fin! <= today ? query.fin! : today;
  const [events,orders,products] = await Promise.all([getPurchaseEvents(),getOrders(),getProducts({includeInactive:true})]);
  const paid = new Set(orders.filter(o=>o.stripeSessionId && (o.paymentStatus === "paid" || o.paymentStatus === "refunded")).map(o=>o.stripeSessionId!));
  // Group the complete retention window first: payment after the filter end still
  // prevents a converted basket from being classified as abandoned.
  const all = purchaseJourneys(events,paid);
  const matching = all.filter(j => j.rows.some(e => { const day=productDay(new Date(e.created!)); return day>=start && day<=end; }) && (!query.produit || j.rows.some(e=>e.productId===query.produit || e.items.some(i=>i.productId===query.produit))));
  const visible = matching.filter(j=>!query.statut || j.status===query.statut);
  const stages = [
    ["Sessions suivies", matching.length],
    ["Produit consulté",matching.filter(j=>j.rows.some(e=>e.kind==="product_view")).length],
    ["Article au panier",matching.filter(j=>j.rows.some(e=>e.items.length>0)).length],
    ["Panier consulté",matching.filter(j=>j.reachedCart).length],
    ["Paiement préparé",matching.filter(j=>j.rows.some(e=>e.kind==="payment_started")).length],
    ["Achat confirmé",matching.filter(j=>j.paid).length],
  ] as const;
  const abandoned = matching.filter(j=>j.status==="abandoned");
  const names = new Map(products.map(p=>[p.id,p.name])); names.set("clicker-studio","Clicker Studio");
  const days = Array.from({length: Math.max(0,Math.min(30,Math.round((Date.parse(end)-Date.parse(start))/86400000)+1))},(_,i)=>shiftProductDay(start,i));
  const chart = days.map(day=>({day,visits:matching.filter(j=>j.rows.some(e=>productDay(new Date(e.created!))===day)).length,carts:matching.filter(j=>j.rows.some(e=>e.kind==="view_cart" && productDay(new Date(e.created!))===day)).length}));
  const max = Math.max(1,...chart.map(d=>d.visits));
  return <div className="mx-auto max-w-7xl space-y-7">
    <div><h1 className="font-display text-3xl font-semibold sm:text-4xl">Parcours d’achat</h1><p className="mt-3 max-w-3xl text-ink-soft">De la consultation d’un produit au paiement. Sessions consenties uniquement, regroupées par onglet et séparées après 30 minutes d’inactivité. Données disponibles à partir de l’activation, sur 30 jours glissants.</p></div>
    <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-sand bg-cream p-5">
      <label className="grid gap-1 text-sm">Du<input type="date" name="debut" min={min} max={today} defaultValue={start} className={field}/></label>
      <label className="grid gap-1 text-sm">Au<input type="date" name="fin" min={start} max={today} defaultValue={end} className={field}/></label>
      <label className="grid min-w-0 gap-1 text-sm">Produit<select name="produit" defaultValue={query.produit || ""} className={`${field} max-w-72`}><option value="">Tous les produits</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}<option value="clicker-studio">Clicker Studio</option></select></label>
      <label className="grid gap-1 text-sm">État<select name="statut" defaultValue={query.statut || ""} className={field}><option value="">Tous les parcours</option>{Object.entries(statuses).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
      <button className="rounded-full bg-ink px-5 py-2.5 font-semibold text-white">Filtrer</button><Link href="/admin/parcours-achat" className="px-2 py-2 text-sm underline">Réinitialiser</Link>
    </form>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
      ["Paniers consultés",String(stages[3][1])], ["Paniers en attente ≥ 30 min",String(abandoned.length)], ["Valeur estimée en attente",formatPrice(abandoned.reduce((s,j)=>s+j.estimatedCents,0))], ["Conversion des sessions suivies",`${matching.length ? (stages[5][1]/matching.length*100).toFixed(1) : "0"} %`],
    ].map(([label,value])=><div key={label} className="rounded-2xl border border-sand bg-white p-5"><p className="text-sm text-ink-soft">{label}</p><p className="mt-2 font-display text-3xl font-semibold">{value}</p></div>)}</div>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-sand bg-cream p-5"><h2 className="font-display text-2xl font-semibold">Étapes du parcours</h2><p className="mt-2 text-sm text-ink-soft">Sessions distinctes par étape. Certains visiteurs arrivent directement au panier.</p><div className="mt-5 space-y-4">{stages.map(([label,n])=><div key={label}><div className="mb-1 flex justify-between gap-3 text-sm"><span>{label}</span><strong>{n}</strong></div><div className="h-5 overflow-hidden rounded bg-sand/40"><div className="h-full bg-terra" style={{width:`${matching.length ? n/matching.length*100 : 0}%`}}/></div></div>)}</div></section>
      <section className="min-w-0 rounded-2xl border border-sand bg-cream p-5"><h2 className="font-display text-2xl font-semibold">Visites et paniers par jour</h2><p className="mt-2 text-sm">Orange : sessions suivies · Noir : panier consulté</p><div className="mt-8 flex h-52 items-end gap-1 overflow-x-auto border-b border-sand" role="img" aria-label="Évolution quotidienne des sessions et des paniers consultés">{chart.map(d=><div key={d.day} className="flex h-full min-w-6 flex-1 items-end justify-center gap-0.5" title={`${d.day} : ${d.visits} sessions, ${d.carts} paniers`}><div className="w-2/5 bg-terra" style={{height:`${d.visits/max*100}%`}}/><div className="w-2/5 bg-ink" style={{height:`${d.carts/max*100}%`}}/></div>)}</div><details className="mt-3 text-sm"><summary className="cursor-pointer underline">Afficher les chiffres quotidiens</summary><table className="mt-3 w-full"><thead><tr><th className="text-left">Jour</th><th>Sessions</th><th>Paniers</th></tr></thead><tbody>{chart.map(d=><tr key={d.day}><td>{d.day}</td><td className="text-center">{d.visits}</td><td className="text-center">{d.carts}</td></tr>)}</tbody></table></details></section>
    </div>
    <section className="rounded-2xl border border-sand bg-cream p-5"><h2 className="font-display text-2xl font-semibold">Préparer les futures relances</h2><p className="mt-3 leading-7">Les envois automatiques sont désactivés. Ces parcours ne contiennent pas de coordonnées : aucune adresse e-mail saisie dans le formulaire n’est enregistrée dans les statistiques. Avant d’activer des relances, il faudra associer un contact au panier et recueillir l’accord nécessaire. Un panier « en attente » indique une absence d’activité depuis 30 minutes ; il peut être repris plus tard.</p><p className="mt-2 text-sm text-ink-soft">Montants estimés hors livraison, remises et options. Achats confirmés à partir des commandes payées côté serveur. Un achat dans une autre session ne peut pas être rapproché de ce panier sans coordonnées. Aucun historique antérieur à l’activation ne peut être reconstitué.</p></section>
    <section><h2 className="font-display text-2xl font-semibold">Détail des parcours · {visible.length}</h2>{!visible.length && <p className="mt-5 rounded-2xl border border-sand bg-white p-6">Aucun parcours suivi sur cette sélection. Les prochaines visites apparaîtront après acceptation de la mesure d’audience.</p>}
      <div className="mt-4 space-y-4">{visible.slice(0,100).map(j=><details key={j.sessionId} open={query.session===j.sessionId} className="rounded-2xl border border-sand bg-white p-5"><summary className="cursor-pointer"><span className="font-semibold">Session {j.sessionId.slice(0,8)}</span><span className="ml-3 rounded-full bg-linen px-3 py-1 text-sm">{statuses[j.status]}</span><span className="mt-2 block text-sm text-ink-soft">Dernière activité : {date(j.lastAt)} · {j.items.reduce((s,i)=>s+i.quantity,0)} article(s) · {formatPrice(j.estimatedCents)} estimés</span></summary>
      <div className="mt-5 grid gap-5 md:grid-cols-2"><div><h3 className="font-semibold">Dernier panier connu</h3>{!j.items.length && <p className="mt-2 text-sm text-ink-soft">Panier vide ou non renseigné.</p>}<ul className="mt-2 space-y-2 text-sm">{j.items.map((item,i)=><li key={i}>{item.quantity} × {names.get(item.productId) || item.name || "Article"}</li>)}</ul><p className="mt-4 text-sm">Contact de relance : non collecté.</p></div><ol className="space-y-2 border-l-2 border-terra pl-4">{j.rows.slice(-60).map((e,i)=><li key={e.eventId || i} className="text-sm"><span className="text-ink-soft">{date(e.created!)}</span><span className="ml-2 font-semibold">{JOURNEY_LABELS[e.kind]}{e.page ? ` · ${JOURNEY_PAGES[e.page]}` : ""}</span>{e.productId && <span className="block text-ink-soft">{names.get(e.productId) || "Article"}</span>}</li>)}{j.paid && <li className="text-sm font-semibold text-green-800">Achat confirmé par une commande payée</li>}</ol></div></details>)}</div>
      {visible.length>100 && <p className="mt-4 text-sm">Les 100 parcours les plus récents sont affichés. Affine les filtres pour consulter les autres.</p>}
    </section>
  </div>;
}
