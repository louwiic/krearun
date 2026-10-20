"use client";
import { useState } from "react";
type Receipt = { reference: string; receipt: string; receivedAt: string; emailSent: boolean };
export default function WithdrawalForm() {
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [contract, setContract] = useState(""); const [address, setAddress] = useState(""); const [website, setWebsite] = useState("");
  const [review, setReview] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [receipt, setReceipt] = useState<Receipt | null>(null); const [submissionKey, setSubmissionKey] = useState("");
  const input = "mt-2 w-full rounded-[10px] border border-sand bg-cream px-4 py-3 font-normal outline-none focus:border-ink";
  function download(value: Receipt) {
    const url = URL.createObjectURL(new Blob([value.receipt], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `accuse-retractation-${value.reference}.txt`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    if (!review) { setReview(true); setError(""); return; }
    setBusy(true); setError("");
    const key = submissionKey || crypto.randomUUID(); setSubmissionKey(key);
    try {
      const response = await fetch("/api/retractation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, contract, address, website, submissionKey: key }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Impossible d’envoyer votre déclaration.");
      setReceipt(result); download(result);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Impossible d’envoyer la déclaration."); } finally { setBusy(false); }
  }
  if (receipt) return <section role="status" className="mt-8 rounded-2xl border-2 border-ink bg-sage/25 p-6"><h2 className="font-display text-2xl">Déclaration reçue</h2><p className="mt-3 text-sm">Référence : {receipt.reference}. Réception : {new Date(receipt.receivedAt).toLocaleString("fr-FR", { timeZone: "Indian/Reunion" })} (heure de La Réunion).</p><p className="mt-3 text-sm">{receipt.emailSent ? "L’accusé de réception a été envoyé à votre adresse e-mail." : "L’envoi de l’e-mail n’a pas abouti. Votre déclaration est bien enregistrée ; conservez l’accusé téléchargeable ci-dessous."}</p><button type="button" onClick={() => download(receipt)} className="mt-4 rounded-[10px] border-2 border-ink px-4 py-3 text-sm font-bold">Télécharger l’accusé de réception</button><p className="mt-4 whitespace-pre-wrap text-sm leading-6">{receipt.receipt}</p></section>;
  return <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border-2 border-ink p-5 sm:p-7">
    {review ? <><h2 className="font-display text-2xl">Vérifiez votre déclaration</h2><p className="text-sm">Je vous notifie ma décision de me rétracter du contrat identifié ci-dessous.</p><dl className="space-y-3 text-sm"><div><dt className="font-bold">Nom et prénom</dt><dd>{name}</dd></div><div><dt className="font-bold">E-mail de réception de l’accusé</dt><dd>{email}</dd></div><div><dt className="font-bold">Contrat et articles concernés</dt><dd className="whitespace-pre-wrap">{contract}</dd></div>{address && <div><dt className="font-bold">Adresse postale</dt><dd>{address}</dd></div>}</dl><button type="button" disabled={busy} onClick={() => { setReview(false); setSubmissionKey(""); }} className="text-sm font-bold underline">Modifier ma déclaration</button></> : <>
      <label className="block text-sm font-bold">Nom et prénom *<input required maxLength={120} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} className={input}/></label>
      <label className="block text-sm font-bold">E-mail pour recevoir l’accusé *<input required type="email" maxLength={254} autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className={input}/></label>
      <label className="block text-sm font-bold">Commande et articles concernés *<textarea required maxLength={2000} rows={5} value={contract} onChange={e=>setContract(e.target.value)} placeholder="Numéro de commande si vous l’avez, articles concernés, date de commande ou de réception…" className={input}/></label>
      <label className="block text-sm font-bold">Adresse postale (facultatif)<textarea maxLength={500} rows={2} autoComplete="street-address" value={address} onChange={e=>setAddress(e.target.value)} className={input}/></label>
      <div aria-hidden="true" className="hidden"><label>Site internet<input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label></div>
    </>}
    <p className="text-xs leading-5 text-ink-soft">Les champs marqués * permettent d’identifier votre déclaration et d’en accuser réception. Aucun motif de rétractation ni compte client n’est demandé. Les données sont utilisées pour traiter la demande et conservées comme preuve selon la <a className="underline" href="/confidentialite">politique de confidentialité</a>.</p>
    {error && <p role="alert" className="text-sm font-bold text-terra-deep">{error}</p>}
    <button type="submit" disabled={busy} className="w-full rounded-[10px] border-2 border-ink bg-terra px-5 py-3 text-sm font-bold text-ink disabled:opacity-50">{busy ? "Envoi en cours…" : review ? "Confirmer la rétractation" : "Vérifier ma déclaration"}</button>
  </form>;
}
