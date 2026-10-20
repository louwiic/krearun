/* eslint-disable @next/next/no-img-element -- Prepared logos and protected customer files must load directly. */
"use client";

import TermsAcceptance from "@/components/legal/TermsAcceptance";
import { LEGAL_VERSION } from "@/lib/legal";
import HolderConfigurationDetails from "./HolderConfigurationDetails";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { canPayHolder, holderModelLabel, holderStatus, holderTotal, HOLDER_STATUS_LABELS, type HolderRequest } from "@/lib/custom-holder";
import { formatPrice, formatDate } from "@/lib/format";
const Preview=dynamic(()=>import('./HolderPreview3D'),{ssr:false});

export default function HolderRequestCard({request}:{request:HolderRequest}) {
  const [expanded,setExpanded]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const logo=`/api/porte-boisson/demandes/${request.id}/logo`;
  const [termsAccepted, setTermsAccepted] = useState(false);
  async function pay() {
    setBusy(true);setError('');
    try{const response=await fetch(`/api/porte-boisson/demandes/${request.id}/paiement`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({termsAccepted,termsVersion:LEGAL_VERSION})});const body=await response.json();if(!response.ok||!body.url)throw new Error(body.error||'Paiement indisponible.');window.location.assign(body.url);}
    catch(e){setError(e instanceof Error?e.message:'Paiement indisponible.');setBusy(false);}
  }
  return <article id={`demande-${request.id}`} className="rounded-2xl border border-sand bg-cream p-5">
    <div className="flex items-start gap-4"><img src={logo} alt="Logo de votre demande" className="h-20 w-20 rounded-xl border border-sand bg-white object-contain"/>
      <div className="min-w-0"><h3 className="font-display text-xl">Porte-boisson 500 ml personnalisé</h3><p className="mt-2 text-xs text-ink-soft">{formatDate(request.created)} · {request.quantity} exemplaire(s) · {request.configuration.bodyColorName} · {holderModelLabel(request.configuration)}</p><p className="mt-2 text-sm font-bold text-terra-deep">{HOLDER_STATUS_LABELS[holderStatus(request)]}</p></div>
    </div>
    <HolderConfigurationDetails configuration={request.configuration}/>
    {request.note&&<p className="mt-4 whitespace-pre-wrap text-sm text-ink-soft">Votre message : {request.note}</p>}
    {request.decision?.message&&<div className="mt-4 rounded-xl bg-linen p-4 text-sm"><p className="font-bold">Réponse de l’atelier</p><p className="mt-2 whitespace-pre-wrap">{request.decision.message}</p></div>}
    {request.decision?.status==='approved'&&<dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between gap-3"><dt>{request.quantity} × {formatPrice(request.decision.unitPriceCents)}</dt><dd>{formatPrice(request.quantity*request.decision.unitPriceCents)}</dd></div><div className="flex justify-between"><dt>Livraison</dt><dd>{formatPrice(request.decision.shippingCents)}</dd></div><div className="flex justify-between border-t border-sand pt-2 font-bold"><dt>{request.orderId?'Total payé':'Total à payer'}</dt><dd>{formatPrice(holderTotal(request))}</dd></div></dl>}
    {canPayHolder(request,request.customerId)&&<div className="mt-4"><TermsAcceptance checked={termsAccepted} onChange={setTermsAccepted} personalized /></div>}
    <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={()=>setExpanded(!expanded)} className="rounded-full border border-sand px-4 py-2 text-sm font-bold">{expanded?'Fermer l’aperçu':'Voir mon aperçu 3D'}</button>
      {canPayHolder(request,request.customerId)&&<button type="button" onClick={()=>void pay()} disabled={busy || !termsAccepted} className="rounded-full bg-terra px-5 py-2 text-sm font-bold text-white disabled:opacity-60">{busy?'Préparation…':`Payer ${formatPrice(holderTotal(request))} →`}</button>}
      {request.orderId&&<Link href="/compte#commandes" className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white">Voir ma commande</Link>}
      {request.decision?.status==='rejected'&&<Link href="/boutique/porte-boisson-500ml-personnalise" className="text-sm font-bold text-terra">Créer une nouvelle demande →</Link>}
    </div>
    {error&&<p role="alert" className="mt-3 text-sm text-terra-deep">{error}</p>}
    {expanded&&<div className="mt-4"><Preview configuration={request.configuration} logo={logo}/></div>}
  </article>;
}
