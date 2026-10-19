"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/types";
import { dayCount, periodRange, previousRange, productOptions, reunionDay, salesAnalytics, UNASSIGNED_PRODUCT, type Period, type SalesFilters, type SalesOrder, type SalesProduct } from "@/lib/sales-analytics";
import StatusBadge from "./StatusBadge";

const SOURCE_LABELS: Record<string, string> = { web: "Boutique en ligne", manual: "Saisie manuelle", crm_std: "Import CRM", csv: "Import CSV" };
const PERIODS: [Period, string][] = [["today", "Aujourd’hui"], ["7d", "7 derniers jours"], ["30d", "30 derniers jours"], ["90d", "90 derniers jours"], ["month", "Ce mois-ci"], ["lastMonth", "Mois dernier"], ["year", "Cette année"], ["all", "Tout l’historique"], ["custom", "Personnalisée"]];
const field = "mt-1.5 w-full min-w-0 rounded-xl border border-sand bg-white px-3 py-2.5 text-sm font-normal text-ink outline-none focus:border-terra";
const panel = "min-w-0 rounded-2xl border border-sand/70 bg-cream p-5 sm:p-6";
const number = (value: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(value);
function shortDate(day: string, monthOnly = false) { return new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", ...(monthOnly ? { month: "short", year: "2-digit" } : { day: "numeric", month: "short" }) }).format(new Date(`${day}T00:00:00Z`)); }
function delta(current: number, previous: number, enabled: boolean) {
  if (!enabled) return "Tout l’historique";
  if (!previous) return current ? "Nouveau sur cette période" : "Stable · aucune activité";
  const percent = (current - previous) / previous * 100;
  return `${percent > 0 ? "+" : ""}${number(percent)} % vs période précédente`;
}
function csvCell(value: string | number) { const text = String(value); return `"${(/^[=+\-@\t\r]/.test(text) ? "'" : "") + text.replaceAll('"', '""')}"`; }

function SalesChart({ data, granularity }: { data: ReturnType<typeof salesAnalytics>["series"]; granularity: string }) {
  const gradient = useId().replaceAll(":", "");
  const [active, setActive] = useState<number | null>(null);
  const [metric, setMetric] = useState<"money" | "orders">("money");
  const width = 900, height = 280, left = 72, right = 18, top = 16, bottom = 42;
  const max = Math.max(1, ...data.map((p) => metric === "orders" ? p.orders : Math.max(p.revenue, p.cash)));
  const plotWidth = width - left - right, plotHeight = height - top - bottom;
  const x = (i: number) => left + plotWidth * (data.length === 1 ? .5 : i / (data.length - 1));
  const y = (value: number) => top + plotHeight * (1 - value / max);
  const path = (key: "revenue" | "cash" | "orders") => data.map((p, i) => `${x(i)},${y(p[key])}`).join(" ");
  const selected = data[active ?? data.length - 1];
  return <div className={panel}>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="font-display text-xl">Évolution des ventes</h2><p className="mt-1 text-xs text-ink-soft">{granularity === "month" ? "Par mois" : granularity === "week" ? "Par semaine (lundi)" : "Par jour"} · survolez ou sélectionnez un point</p></div>
      <div className="flex rounded-full border border-sand bg-white p-1">{([["money", "Montants"], ["orders", "Commandes"]] as const).map(([key, label]) => <button key={key} type="button" aria-pressed={metric === key} onClick={() => setMetric(key)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${metric === key ? "bg-ink text-cream" : "text-ink-soft"}`}>{label}</button>)}</div>
    </div>
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs">{metric === "money" ? <><span className="flex items-center gap-2"><i className="h-2 w-5 rounded bg-ink"/>Montant commandé</span><span className="flex items-center gap-2"><i className="h-2 w-5 rounded bg-terra"/>Encaissé produits</span></> : <span>Commandes hors annulations et remboursements</span>}</div>
    <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Graphique des ventes, défilement horizontal"><svg viewBox={`0 0 ${width} ${height}`} className="mt-4 w-full min-w-[600px]" role="img" aria-label={metric === "money" ? "Évolution du montant commandé et encaissé, hors livraison" : "Évolution du nombre de commandes"}>
      <defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f25c2a" stopOpacity=".18"/><stop offset="100%" stopColor="#f25c2a" stopOpacity="0"/></linearGradient></defs>
      {[0, .25, .5, .75, 1].map((ratio) => <g key={ratio}><line x1={left} x2={width - right} y1={y(max * ratio)} y2={y(max * ratio)} stroke="#ded8ce" strokeDasharray="3 5"/><text x={left - 10} y={y(max * ratio) + 4} textAnchor="end" fontSize="11" fill="#706b62">{metric === "money" ? `${number(max * ratio / 100)} €` : number(max * ratio)}</text></g>)}
      {data.length > 0 && <>
        <polygon points={`${x(0)},${y(0)} ${path(metric === "orders" ? "orders" : "cash")} ${x(data.length - 1)},${y(0)}`} fill={`url(#${gradient})`}/>
        {metric === "money" && <polyline points={path("revenue")} fill="none" stroke="#24211c" strokeWidth="2.5" strokeLinejoin="round"/>}
        <polyline points={path(metric === "orders" ? "orders" : "cash")} fill="none" stroke="#ee5b2b" strokeWidth="3" strokeLinejoin="round"/>
        {data.map((point, i) => <g key={point.day}>
          {(data.length <= 8 || i % Math.max(1, Math.ceil((data.length - 1) / 6)) === 0 || i === data.length - 1) && <text x={x(i)} y={height - 13} textAnchor="middle" fontSize="11" fill="#706b62">{shortDate(point.day, granularity === "month")}</text>}
          <rect x={x(i) - Math.max(4, plotWidth / Math.max(data.length, 1) / 2)} y={top} width={Math.max(8, plotWidth / Math.max(data.length, 1))} height={plotHeight} fill="transparent" tabIndex={0} role="button" aria-label={`${shortDate(point.day)} : ${point.orders} commandes, ${formatPrice(point.revenue)} commandés, ${formatPrice(point.cash)} encaissés`} onFocus={() => setActive(i)} onMouseEnter={() => setActive(i)} onClick={() => setActive(i)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActive(i); } }}><title>{`${shortDate(point.day)} · ${formatPrice(point.cash)} encaissés · ${point.orders} commandes`}</title></rect>
        </g>)}
        {active !== null && data[active] && <><line x1={x(active)} x2={x(active)} y1={top} y2={y(0)} stroke="#a99c8c" strokeDasharray="4 4"/><circle cx={x(active)} cy={y(metric === "orders" ? data[active].orders : data[active].cash)} r="5" fill="#ee5b2b" stroke="white" strokeWidth="2"/></>}
      </>}
    </svg></div>
    <p className="mt-2 text-[11px] text-ink-faint sm:hidden">Glissez horizontalement pour parcourir le graphique.</p>
    <p className="min-h-5 text-xs text-ink-soft" aria-live="polite">{selected ? <>{shortDate(selected.day, granularity === "month")} : <strong>{formatPrice(selected.revenue)}</strong> commandés · <strong>{formatPrice(selected.cash)}</strong> encaissés · {selected.orders} commande{selected.orders > 1 ? "s" : ""}</> : "Aucune donnée sur cette période."}</p>
  </div>;
}

export default function SalesDashboard({ orders, products, today }: { orders: SalesOrder[]; products: SalesProduct[]; today: string }) {
  const earliest = useMemo(() => orders.map((o) => reunionDay(o.orderedAt)).filter(Boolean).sort()[0] || today, [orders, today]);
  const [period, setPeriod] = useState<Period>("30d");
  const [custom, setCustom] = useState(() => periodRange("30d", today, earliest));
  const [product, setProduct] = useState(""); const [source, setSource] = useState(""); const [payment, setPayment] = useState("");
  const [granularity, setGranularity] = useState<SalesFilters["granularity"]>("auto");
  const [sort, setSort] = useState<"quantity" | "revenue" | "cash" | "orders">("quantity");
  const range = period === "custom" ? custom : periodRange(period, today, earliest);
  const { from, to } = range;
  const filters = useMemo(() => ({ from, to, product, source, payment, granularity }), [from, to, product, source, payment, granularity]);
  const analysis = useMemo(() => salesAnalytics(orders, products, filters), [orders, products, filters]);
  const comparison = useMemo(() => analysis.rangeValid ? salesAnalytics(orders, products, { ...filters, ...previousRange(filters.from, filters.to) }) : analysis, [orders, products, filters, analysis]);
  const options = useMemo(() => productOptions(orders, products), [orders, products]);
  const ranked = [...analysis.products].sort((a, b) => b[sort] - a[sort] || a.name.localeCompare(b.name, "fr"));
  const top = ranked.slice(0, 10), maxRank = Math.max(1, ...top.map((p) => p[sort]));
  const canCompare = period !== "all" && analysis.rangeValid;
  const cards = [
    { label: "Montant commandé", value: formatPrice(analysis.revenue), previous: comparison.revenue, current: analysis.revenue, note: "Produits TTC, hors livraison" },
    { label: "Encaissé produits", value: formatPrice(analysis.cash), previous: comparison.cash, current: analysis.cash, note: "Paiements et acomptes, hors livraison" },
    { label: "Commandes", value: number(analysis.count), previous: comparison.count, current: analysis.count, note: `${analysis.paidOrders} avec un encaissement` },
    { label: "Panier moyen", value: formatPrice(analysis.average), previous: comparison.average, current: analysis.average, note: product ? "Montant moyen du produit par commande" : "Montant commandé ÷ commandes" },
    { label: "Articles identifiés", value: number(analysis.quantity), previous: comparison.quantity, current: analysis.quantity, note: "Quantités des lignes produits renseignées" },
    { label: "Reste à encaisser", value: formatPrice(analysis.outstanding), previous: comparison.outstanding, current: analysis.outstanding, note: "Commandé moins encaissé produits" },
    { label: "Clients identifiés", value: number(analysis.customers), previous: comparison.customers, current: analysis.customers, note: "Dédoublonnés par e-mail ou téléphone" },
    { label: "Annulations", value: `${analysis.cancelled} · ${number(analysis.cancellationRate)} %`, previous: comparison.cancelled, current: analysis.cancelled, note: `${analysis.refunded} commande(s) remboursée(s), exclue(s) des ventes` },
  ];
  function reset() { setPeriod("30d"); setCustom(periodRange("30d", today, earliest)); setProduct(""); setSource(""); setPayment(""); setGranularity("auto"); }
  function exportCsv() {
    const rows: (string | number)[][] = [
      ["Ventes Krearun", `${range.from} au ${range.to}`, "Fuseau Indian/Reunion"],
      ["Produit", product === UNASSIGNED_PRODUCT ? "Sans détail produit" : options.find((p) => p.id === product)?.name || "Tous"],
      ["Canal", SOURCE_LABELS[source] || "Tous", "Paiement", payment || "Tous"],
      ["Montants TTC hors livraison ; annulations et remboursements exclus ; encaissements rattachés à la date de commande."],
      ["Indicateur", "Valeur"], ["Montant commandé EUR", (analysis.revenue / 100).toFixed(2)], ["Encaissé produits EUR", (analysis.cash / 100).toFixed(2)], ["Commandes", analysis.count], ["Articles identifiés", analysis.quantity], ["Reste à encaisser EUR", (analysis.outstanding / 100).toFixed(2)],
      [], ["Période", "Commandé EUR", "Encaissé produits EUR", "Commandes"],
      ...analysis.series.map((p) => [p.day, (p.revenue / 100).toFixed(2), (p.cash / 100).toFixed(2), p.orders]),
      [], ["Produit", "Quantité", "Commandes", "Commandé EUR", "Encaissé produits EUR"],
      ...ranked.map((p) => [p.name, p.quantity, p.orders, (p.revenue / 100).toFixed(2), (p.cash / 100).toFixed(2)]),
      ["Sans détail produit", "Quantité inconnue", analysis.withoutDetails, (analysis.withoutDetailsRevenue / 100).toFixed(2)],
    ];
    const url = URL.createObjectURL(new Blob(["\ufeff" + rows.map((r) => r.map(csvCell).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `krearun-ventes-${range.from}-${range.to}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="mt-8 space-y-6" aria-label="Analyse des ventes">
    <div className={panel}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-display text-2xl">Pilotage des ventes</h2><p className="mt-1 text-sm text-ink-soft">Périodes inclusives, heure de La Réunion. Les filtres s’appliquent à tous les indicateurs et graphiques de cette section.</p></div><button type="button" onClick={exportCsv} disabled={!analysis.rangeValid} className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-cream disabled:opacity-40">Exporter CSV</button></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs font-bold">Période<select value={period} onChange={(e) => { const next = e.target.value as Period; if (next === "custom") setCustom(range); setPeriod(next); }} className={field}>{PERIODS.map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
        <label className="text-xs font-bold">Produit<select value={product} onChange={(e) => setProduct(e.target.value)} className={field}><option value="">Tous les produits</option><option value={UNASSIGNED_PRODUCT}>Sans détail produit</option>{options.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label className="text-xs font-bold">Canal de vente<select value={source} onChange={(e) => setSource(e.target.value)} className={field}><option value="">Tous les canaux</option>{Object.entries(SOURCE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="text-xs font-bold">Paiement<select value={payment} onChange={(e) => setPayment(e.target.value)} className={field}><option value="">Tous les paiements</option><option value="paid">Payé intégralement</option><option value="deposit">Acompte</option><option value="unpaid">Non payé</option><option value="refunded">Remboursé</option></select></label>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <label className="min-w-36 text-xs font-bold">Du<input type="date" value={range.from} max={today} className={field} onChange={(e) => { setCustom({ ...range, from: e.target.value }); setPeriod("custom"); }}/></label>
        <label className="min-w-36 text-xs font-bold">Au<input type="date" value={range.to} max={today} className={field} onChange={(e) => { setCustom({ ...range, to: e.target.value }); setPeriod("custom"); }}/></label>
        <label className="min-w-36 text-xs font-bold">Regroupement<select value={granularity} onChange={(e) => setGranularity(e.target.value as SalesFilters["granularity"])} className={field}><option value="auto">Automatique</option><option value="day">Jour</option><option value="week">Semaine</option><option value="month">Mois</option></select></label>
        <button type="button" onClick={reset} className="py-2.5 text-sm font-semibold text-ink-soft underline underline-offset-4">Réinitialiser</button>
      </div>
      {!analysis.rangeValid ? <p role="alert" className="mt-4 text-sm font-bold text-terra-deep">Choisissez une date de début et une date de fin valides, dans cet ordre.</p> : <p className="mt-4 text-xs text-ink-soft">{dayCount(range.from, range.to)} jours · {canCompare ? `Comparaison du ${previousRange(range.from, range.to).from.split("-").reverse().join("/")} au ${previousRange(range.from, range.to).to.split("-").reverse().join("/")}` : "Comparaison désactivée sur l’historique complet"}</p>}
    </div>
    {analysis.rangeValid && <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <div key={card.label} className={panel}><p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{card.label}</p><p className="mt-3 font-display text-3xl">{card.value}</p><p className="mt-2 text-[11px] font-semibold text-ink-soft">{delta(card.current, card.previous, canCompare)}</p><p className="mt-2 text-[11px] leading-4 text-ink-faint">{card.note}</p></div>)}</div>
      {analysis.count === 0 && <p role="status" className="rounded-xl border border-sand bg-cream p-5 text-sm">Aucune vente correspondant à ces filtres. Modifiez la période ou réinitialisez les filtres.</p>}
      {analysis.withoutDetails > 0 && <p className="rounded-xl border border-sand bg-white/60 p-4 text-xs leading-5 text-ink-soft"><strong>{analysis.withoutDetails} commande(s) sans détail produit, soit {formatPrice(analysis.withoutDetailsRevenue)}.</strong> Elles sont incluses dans les montants et commandes, mais exclues des quantités et du classement produits. Aucun produit n’est déduit des notes libres.</p>}
      <SalesChart key={`${range.from}-${range.to}-${granularity}-${product}-${source}-${payment}`} data={analysis.series} granularity={analysis.granularity}/>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={panel}><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-xl">Produits les plus vendus</h2><select aria-label="Classer les produits par" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded-lg border border-sand bg-white p-2 text-xs"><option value="quantity">Quantité</option><option value="revenue">Montant commandé</option><option value="cash">Encaissé</option><option value="orders">Commandes</option></select></div>
          <p className="mt-2 text-xs text-ink-soft">Top 10 · lignes produits identifiées · annulations et remboursements exclus</p>
          <div className="mt-5 space-y-4">{top.map((p, i) => <div key={p.key}><div className="mb-1.5 flex justify-between gap-4 text-xs"><span className="min-w-0 truncate" title={p.name}>{i + 1}. {p.name}</span><strong className="shrink-0">{sort === "cash" || sort === "revenue" ? formatPrice(p[sort]) : number(p[sort])}</strong></div><div className="h-2 rounded-full bg-sand/50"><div className="h-2 rounded-full bg-terra" style={{ width: `${p[sort] / maxRank * 100}%` }}/></div></div>)}{!top.length && <p className="py-8 text-sm text-ink-soft">Aucune ligne produit détaillée pour ces filtres.</p>}</div>
        </div>
        <div className="space-y-6">
          <div className={panel}><h2 className="font-display text-xl">Canaux de vente</h2><p className="mt-1 text-xs text-ink-soft">Montant commandé hors livraison</p><div className="mt-5 space-y-4">{analysis.sources.sort((a, b) => b.revenue - a.revenue).map((s) => <div key={s.key}><div className="flex justify-between gap-3 text-xs"><span>{SOURCE_LABELS[s.key] || s.key} · {s.orders} commande(s)</span><strong>{formatPrice(s.revenue)}</strong></div><div className="mt-2 h-2 rounded-full bg-sand/50"><div className="h-2 rounded-full bg-ink" style={{ width: `${analysis.revenue ? s.revenue / analysis.revenue * 100 : 0}%` }}/></div></div>)}{!analysis.sources.length && <p className="text-sm text-ink-soft">Aucune vente à répartir.</p>}</div></div>
          <div className={panel}><h2 className="font-display text-xl">Statuts des commandes</h2><p className="mt-1 text-xs text-ink-soft">Toutes les commandes filtrées, annulations incluses</p><div className="mt-5 space-y-2">{analysis.statuses.map((s) => <div key={s.key} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-xs"><span>{ORDER_STATUSES.find((status) => status.value === s.key)?.label || s.key}</span><span>{s.count} · {number(analysis.matched ? s.count / analysis.matched * 100 : 0)} %</span><div className="col-span-2 h-1.5 rounded-full bg-sand/50"><div className={`h-1.5 rounded-full ${s.key === "cancelled" ? "bg-terra" : "bg-ink/60"}`} style={{ width: `${analysis.matched ? s.count / analysis.matched * 100 : 0}%` }}/></div></div>)}{!analysis.statuses.length && <p className="text-sm text-ink-soft">Aucune commande sur cette période.</p>}</div></div>
        </div>
      </div>
      <div className={panel}><h2 className="font-display text-xl">Détail des ventes par produit</h2><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-sand text-xs text-ink-soft"><tr>{["Produit", "Articles", "Commandes", "Commandé", "Encaissé", "Part du montant"].map((label) => <th key={label} className="whitespace-nowrap px-3 py-3 first:pl-0">{label}</th>)}</tr></thead><tbody>{ranked.map((p) => <tr key={p.key} className="border-b border-sand/50"><td className="min-w-44 py-3 pr-3 font-semibold">{products.some((product) => product.id === p.key) ? <Link href={`/admin/produits/${p.key}`} className="hover:text-terra">{p.name}</Link> : p.name}</td><td className="px-3 py-3">{number(p.quantity)}</td><td className="px-3 py-3">{p.orders}</td><td className="whitespace-nowrap px-3 py-3">{formatPrice(p.revenue)}</td><td className="whitespace-nowrap px-3 py-3">{formatPrice(p.cash)}</td><td className="px-3 py-3">{number(analysis.revenue ? p.revenue / analysis.revenue * 100 : 0)} %</td></tr>)}{!ranked.length && <tr><td colSpan={6} className="py-6 text-ink-soft">Aucun produit identifié.</td></tr>}</tbody></table></div></div>
      <div className={panel}><div className="flex items-center justify-between gap-3"><h2 className="font-display text-xl">Dernières ventes de la sélection</h2><Link href="/admin/commandes" className="text-xs font-bold text-terra">Toutes les commandes</Link></div><ul className="mt-4 divide-y divide-sand/60">{analysis.recent.map((o) => <li key={o.id}><Link href={`/admin/commandes/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm hover:text-terra"><span><strong>#{o.number} — {o.name || "Client"}</strong><span className="mt-1 block text-xs text-ink-faint">{shortDate(reunionDay(o.orderedAt))} · {SOURCE_LABELS[o.source]}</span></span><span className="flex items-center gap-3"><StatusBadge status={o.status}/><strong>{formatPrice(o.selectedRevenue)}</strong></span></Link></li>)}</ul>{!analysis.recent.length && <p className="mt-4 text-sm text-ink-soft">Aucune vente dans la sélection.</p>}</div>
      <details className="rounded-xl border border-sand px-5 py-4 text-xs leading-6 text-ink-soft"><summary className="cursor-pointer font-bold">Comment sont calculés ces indicateurs ?</summary><p className="mt-3">Les montants sont TTC, hors livraison. Les commandes annulées ou remboursées sont exclues des ventes, des quantités et des encaissements. Les acomptes sont pris en compte. Les encaissements représentent le montant payé actuellement sur les commandes de la période, regroupé par date de commande : ce graphique n’est pas un relevé des dates de paiement.</p><p className="mt-2">Pour une commande avec plusieurs produits, le montant final après remise est réparti au prorata des lignes. Les paiements partiels sont répartis de la même façon, en retirant la part de livraison. Le filtre produit conserve uniquement sa part du montant ; une commande contenant ce produit compte une fois. Les produits historiques sont rapprochés par identifiant, ou par nom si l’identifiant est absent. Les quantités ne sont jamais déduites d’une description.</p><p className="mt-2">La comparaison porte sur le même nombre de jours immédiatement avant la sélection, avec les mêmes filtres. Les dates sont inclusives et utilisent le fuseau de La Réunion. Les graphiques et exports ne calculent ni marge, ni bénéfice, ni TVA déductible.</p></details>
    </>}
  </section>;
}
