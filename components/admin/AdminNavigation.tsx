"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import AdminIcon, { type AdminIconName } from "./AdminIcon";
const groups: {label:string; items:[string,string,AdminIconName][]}[] = [
  {label:"Pilotage",items:[["/admin","Tableau de bord","dashboard"],["/admin/assistant","Assistant IA","assistant"]]},
  {label:"Catalogue",items:[["/admin/produits","Produits","products"],["/admin/categories","Catégories","categories"]]},
  {label:"Production",items:[["/admin/commandes","Commandes","orders"],["/admin/personnalisations","Personnalisations","customize"],["/admin/inventaire","Inventaire","inventory"],["/admin/porte-cles","Porte-clés prénom","nozzle"],["/admin/generateur-3d","Prénoms 3D","nozzle"],["/admin/calculateur","Calculateur","calculator"]]},
  {label:"Ventes & marketing",items:[["/admin/parcours-achat","Parcours d’achat","journey"],["/admin/codes-promo","Codes promo","promo"],["/admin/newsletter","Newsletter","newsletter"]]},
  {label:"Relation client",items:[["/admin/clients","Clients","clients"],["/admin/messages","Messages","messages"],["/admin/avis","Avis","reviews"],["/admin/retractations","Rétractations","orders"]]},
  {label:"Administration",items:[["/admin/parametres","Réglages","settings"],["/admin/doc","Documentation","docs"]]},
];
export default function AdminNavigation({mobile=false}:{mobile?:boolean}) {
  const path=usePathname();const [open,setOpen]=useState(false);
  const active=(href:string)=>href==="/admin"?path===href:path===href||path.startsWith(href+"/");
  const menu=<div className="space-y-2">{groups.map(group=><details key={group.label+path} open={group.items.some(([href])=>active(href)) || group.label==="Catalogue"} className="rounded-xl">
    <summary className="cursor-pointer rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide text-ink-soft hover:bg-linen">{group.label}</summary>
    <div className="mt-1 space-y-1">{group.items.map(([href,label,icon])=><Link key={href} href={href} onClick={()=>setOpen(false)} aria-current={active(href)?"page":undefined} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${active(href)?"bg-terra/15 text-terra-deep":"text-ink-soft hover:bg-linen hover:text-ink"}`}><AdminIcon name={icon} className="h-5 w-5"/>{label}</Link>)}</div>
  </details>)}</div>;
  if(!mobile)return <nav aria-label="Navigation administration" className="my-6 flex-1">{menu}</nav>;
  return <div className="w-full px-4"><button type="button" aria-expanded={open} aria-controls="admin-mobile-menu" onClick={()=>setOpen(!open)} className="w-full rounded-xl bg-linen px-4 py-3 text-sm font-bold">{open?"Fermer le menu ✕":"☰ Menu administration"}</button>{open&&<nav id="admin-mobile-menu" aria-label="Navigation administration mobile" className="fixed inset-x-0 bottom-20 top-4 overflow-y-auto rounded-2xl border border-sand bg-cream p-4 shadow-xl">{menu}</nav>}</div>;
}
