"use client";
import Link from "next/link";
import {useMemo,useState} from "react";
import {productCounts,shiftProductDay,type ProductDailyStats,type ProductCounts} from "@/lib/product-events";
const labels={impressions:"Impressions",clicks:"Clics",views:"Vues des fiches"};
const format=(value:number)=>new Intl.NumberFormat("fr-FR").format(value);
export default function ProductAudience({rows,products,today,initialProduct=""}:{rows:ProductDailyStats[]|null;products:{id:string;name:string}[];today:string;initialProduct?:string}){
  const [period,setPeriod]=useState("30");const [product,setProduct]=useState(initialProduct);
  const [from,setFrom]=useState(shiftProductDay(today,-29));const [until,setUntil]=useState(today);
  const [metric,setMetric]=useState<keyof ProductCounts>("views");
  const [sort,setSort]=useState<keyof ProductCounts>("views");
  const start=period==="custom"?from:period==="all"?"":shiftProductDay(today,-Number(period)+1);
  const end=period==="custom"?until:today;
  const invalid=period==="custom"&&(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end)||start>end||end>today);
  const stats=useMemo(()=>productCounts(rows||[],invalid?"9999":start,end,product),[rows,start,end,product,invalid]);
  const ranked=products.filter(p=>!product||p.id===product).map(p=>({...p,...(stats.byProduct[p.id]||{impressions:0,clicks:0,views:0})})).sort((a,b)=>b[sort]-a[sort]||a.name.localeCompare(b.name,"fr"));
  const firstActivity=Object.keys(stats.byDay).sort()[0]||shiftProductDay(end||today,-29);
  const first=start&&start>firstActivity?start:firstActivity;
  const days:string[]=[];for(let day=first;day<=end&&days.length<4000;day=shiftProductDay(day,1))days.push(day);
  // Weekly buckets keep long histories legible without dropping any events.
  const step=Math.max(1,Math.ceil(days.length/90));
  const series=days.filter((_,i)=>i%step===0).map((day,i)=>({day,value:days.slice(i*step,(i+1)*step).reduce((n,key)=>n+(stats.byDay[key]?.[metric]||0),0)}));
  const max=Math.max(2,...series.map(p=>p.value));
  const points=series.map((p,i)=>`${50+(series.length<2?400:i/(series.length-1)*800)},${190-p.value/max*155}`).join(" ");
  if(rows===null)return <p role="status" className="rounded-2xl border border-sand p-5">Les statistiques produits sont temporairement indisponibles. Les produits restent accessibles normalement.</p>;
  return <div className="space-y-6">
    <div className="grid gap-4 rounded-2xl border border-sand bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-sm font-semibold">Période<select value={period} onChange={e=>setPeriod(e.target.value)} className="mt-2 w-full rounded-xl border border-sand p-3"><option value="7">7 derniers jours</option><option value="30">30 derniers jours</option><option value="90">90 derniers jours</option><option value="all">Depuis l’activation</option><option value="custom">Dates personnalisées</option></select></label>
      <label className="text-sm font-semibold">Produit<select value={product} onChange={e=>setProduct(e.target.value)} className="mt-2 w-full rounded-xl border border-sand p-3"><option value="">Tous les produits</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      {period==="custom"&&<><label className="text-sm font-semibold">Du<input type="date" value={from} max={until||today} onChange={e=>setFrom(e.target.value)} className="mt-2 w-full rounded-xl border border-sand p-3"/></label><label className="text-sm font-semibold">Au<input type="date" value={until} min={from} max={today} onChange={e=>setUntil(e.target.value)} className="mt-2 w-full rounded-xl border border-sand p-3"/></label></>}
    </div>
    {invalid&&<p role="alert" className="text-sm text-red-800">La date de début doit précéder la date de fin.</p>}
    <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">{(["impressions","clicks","views"] as const).map(key=><div key={key} className="rounded-2xl border border-sand bg-white p-5"><dt className="text-sm text-ink-soft">{labels[key]}</dt><dd className="mt-2 text-3xl font-bold">{format(stats.total[key])}</dd></div>)}<div className="rounded-2xl border border-sand bg-white p-5"><dt className="text-sm text-ink-soft">Taux de clic</dt><dd className="mt-2 text-3xl font-bold">{stats.total.impressions?`${(stats.total.clicks/stats.total.impressions*100).toLocaleString("fr-FR",{maximumFractionDigits:1})} %`:"—"}</dd></div></dl>
    <section className="rounded-2xl border border-sand bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-xl">Évolution de la visibilité</h2><select aria-label="Mesure du graphique" value={metric} onChange={e=>setMetric(e.target.value as keyof ProductCounts)} className="rounded-xl border border-sand p-2 text-sm">{Object.entries(labels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></div>
      <svg viewBox="0 0 900 230" className="mt-4 w-full" role="img" aria-label={`${labels[metric]} du ${first} au ${end}`}>
        {[0,.5,1].map(r=><g key={r}><line x1="50" x2="850" y1={190-r*155} y2={190-r*155} stroke="#ded8ce"/><text x="40" y={194-r*155} textAnchor="end" fontSize="12" fill="#706b62">{format(Math.round(max*r))}</text></g>)}
        {series.length>1?<polyline points={points} fill="none" stroke="#ff6b35" strokeWidth="3"/>:series.length===1?<circle cx="450" cy={190-series[0].value/max*155} r="4" fill="#ff6b35"/>:null}
        <text x="50" y="220" fontSize="12" fill="#706b62">{first}</text><text x="850" y="220" textAnchor="end" fontSize="12" fill="#706b62">{end}</text>
      </svg>
      {!stats.total.impressions&&!stats.total.clicks&&!stats.total.views&&<p className="text-sm text-ink-soft">Aucune activité mesurée sur cette période.</p>}
    </section>
    <section className="overflow-x-auto rounded-2xl border border-sand bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5"><h2 className="font-display text-xl">Performance par produit</h2><label className="text-sm">Trier par <select value={sort} onChange={e=>setSort(e.target.value as keyof ProductCounts)} className="ml-2 rounded-xl border border-sand p-2">{Object.entries(labels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label></div>
      <table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-y border-sand"><th className="p-4">Produit</th><th className="p-4 text-right">Impressions</th><th className="p-4 text-right">Clics</th><th className="p-4 text-right">Vues fiche</th><th className="p-4 text-right">Taux de clic</th></tr></thead><tbody>{ranked.map(p=><tr key={p.id} className="border-b border-sand/50 last:border-0"><td className="p-4 font-semibold"><Link href={p.id==="clicker-studio"?"/admin/produits/statistiques?produit=clicker-studio":`/admin/produits/${p.id}`} className="hover:underline">{p.name}</Link></td><td className="p-4 text-right">{format(p.impressions)}</td><td className="p-4 text-right">{format(p.clicks)}</td><td className="p-4 text-right">{format(p.views)}</td><td className="p-4 text-right">{p.impressions?`${(p.clicks/p.impressions*100).toLocaleString("fr-FR",{maximumFractionDigits:1})} %`:"—"}</td></tr>)}</tbody></table>
    </section>
    <div className="space-y-2 text-xs leading-5 text-ink-soft"><p>Impression : carte produit visible à au moins 50 % pendant 1 seconde, ou clic sur cette carte. Clic : ouverture d’une fiche depuis un lien produit. Vue fiche : visite d’une fiche produit pendant au moins 1 seconde.</p><p>Un événement par produit, type d’action, jour et session d’onglet. Les vues directes d’une fiche peuvent dépasser les clics depuis les listes. Les visiteurs qui refusent la mesure d’audience, les administrateurs connectés et les robots identifiés sont exclus. Comptage depuis l’activation, sans reprise de l’historique. Dates à l’heure de La Réunion.</p></div>
  </div>;
}
