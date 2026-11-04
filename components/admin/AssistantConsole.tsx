"use client";

import { useRef, useState } from "react";
import type { AssistantReply, AssistantProposal } from "@/lib/assistant";

type Overview = { enabled: boolean; openaiReady: boolean; whatsappReady: boolean; storageReady: boolean; model: string; monthlyLimit: number; used: number; estimatedUsd: number; recent: { id: string; channel: string; state: string; created: string }[] };
type Message = { id: string; role: "user" | "assistant"; text: string; proposals?: AssistantProposal[] };
const examples = ["Quelles sont les dernières commandes ?", "Quels filaments sont indisponibles ?", "Cherche le porte-boisson Monster", "Aide-moi à créer un nouveau produit"];
export default function AssistantConsole({ initial }: { initial: Overview }) {
  const [overview, setOverview] = useState(initial);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [handled, setHandled] = useState<string[]>([]);
  const conversation = useRef("");
  const pending = useRef(false);
  const ready = overview.enabled && overview.openaiReady && overview.storageReady;
  async function send(message?: string, action?: AssistantProposal, cancel = false) {
    const value = (message ?? text).trim();
    if (pending.current || (!action && !value)) return;
    pending.current = true; setBusy(true); setError("");
    if (!conversation.current) conversation.current = crypto.randomUUID();
    if (!action) { setMessages(current => [...current, { id: crypto.randomUUID(), role: "user", text: value }]); setText(""); }
    try {
      const response = await fetch("/api/admin/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: conversation.current, requestId: crypto.randomUUID(), message: value, ...(action ? { actionId: action.id, cancel } : {}) }) });
      const data = await response.json() as AssistantReply & { error?: string; overview?: Overview };
      if (!response.ok) throw new Error(data.error || "La demande a échoué.");
      if (data.overview) setOverview(data.overview);
      setMessages(current => [...current, { id: crypto.randomUUID(), role: "assistant", text: data.message, proposals: data.proposals }]);
      if (action) setHandled(current => [...current, action.id]);
    } catch (error) { setError(error instanceof Error ? error.message : "Connexion interrompue. Vérifie la fiche avant de recommencer."); }
    finally { pending.current = false; setBusy(false); }
  }
  return <>
    <p className="text-sm font-bold uppercase tracking-widest text-terra-deep">Votre atelier, à portée de message</p>
    <h1 className="mt-2 text-3xl font-bold md:text-4xl">Assistant Kréarun</h1>
    <p className="mt-3 max-w-3xl text-ink-soft">Consultez les commandes, préparez vos fiches produits et gérez vos stocks. Vérifiez chaque modification dans le récapitulatif avant de la valider.</p>
    <div className="mt-7 grid gap-4 sm:grid-cols-3">
      {[{ label: "Assistant", value: ready ? "Prêt à vous aider" : "Configuration à terminer" }, { label: "Demandes ce mois-ci", value: `${overview.used} / ${overview.monthlyLimit}` }, { label: "Coût IA estimé ce mois-ci", value: `${overview.estimatedUsd.toFixed(3)} $` }].map(card => <div key={card.label} className="rounded-2xl border border-sand bg-cream p-5"><p className="text-sm text-ink-soft">{card.label}</p><p className="mt-2 text-lg font-bold">{card.value}</p></div>)}
    </div>
    <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="min-w-0 rounded-3xl border border-sand bg-cream p-5 md:p-7" aria-label="Conversation avec l’assistant">
        {!messages.length && <><h2 className="text-xl font-bold">Que souhaitez-vous faire ?</h2><p className="mt-2 text-ink-soft">Un numéro de commande, un nom de produit ou une demande en quelques mots.</p><div className="my-6 grid gap-3 sm:grid-cols-2">{examples.map(example => <button key={example} disabled={!ready || busy} onClick={() => { void send(example); }} className="rounded-2xl border border-sand p-4 text-left text-sm font-semibold hover:bg-linen disabled:opacity-50">{example} ↗</button>)}</div></>}
        <div role="log" aria-label="Messages" aria-live="polite" className="max-h-[65vh] space-y-5 overflow-y-auto">
          {messages.map(m => <div key={m.id} className={`rounded-2xl p-4 ${m.role === "user" ? "ml-5 bg-linen" : "border border-sand"}`}><p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-soft">{m.role === "user" ? "Vous" : "Kréarun"}</p><p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{m.text}</p>{m.proposals?.map(p => <div key={p.id} className="mt-4 rounded-xl border border-terra/40 bg-linen p-4"><p className="font-bold">Modification à valider</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">{p.summary}</p><p className="mt-3 text-xs text-ink-soft">Valable 30 minutes. Vérification des données avant enregistrement.</p><div className="mt-4 flex flex-wrap gap-3"><button disabled={busy || handled.includes(p.id)} onClick={() => { void send(undefined, p); }} className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-cream disabled:opacity-50">{handled.includes(p.id) ? "Proposition traitée" : "Confirmer la modification"}</button><button disabled={busy || handled.includes(p.id)} onClick={() => { void send(undefined, p, true); }} className="rounded-full border border-sand px-5 py-2 text-sm disabled:opacity-50">Annuler</button></div></div>)}</div>)}
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl bg-blush/30 p-3 text-sm text-terra-deep">{error}</p>}
        {busy && <p role="status" className="mt-4 text-sm text-ink-soft">L’assistant prépare sa réponse…</p>}
        <form className="mt-6" onSubmit={e => { e.preventDefault(); void send(); }}><label htmlFor="assistant-message" className="text-sm font-semibold">Votre demande</label><textarea id="assistant-message" value={text} onChange={e => setText(e.target.value)} disabled={!ready || busy} maxLength={3000} rows={3} placeholder={ready ? "Ex. : retrouve la commande #1210" : "Activez OpenAI pour commencer"} className="mt-2 w-full resize-y rounded-2xl border border-sand bg-white p-4 text-base disabled:opacity-60" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-ink-soft">{overview.model} · pas d’envoi d’e-mail aux clients</span><button disabled={!ready || busy || !text.trim()} className="rounded-full bg-ink px-6 py-3 font-semibold text-cream disabled:opacity-50">Envoyer ↗</button></div></form>
      </section>
      <aside className="space-y-5">
        <section className="rounded-2xl border border-sand bg-cream p-5"><h2 className="text-lg font-bold">Connexion</h2><ul className="mt-4 space-y-3 text-sm">{[["Base privée", overview.storageReady], ["Clé OpenAI", overview.openaiReady], ["Assistant activé", overview.enabled], ["WhatsApp", overview.whatsappReady]].map(([label, status]) => <li key={String(label)} className="flex items-center justify-between gap-2"><span>{label}</span><span className={status ? "font-semibold text-green-800" : "text-ink-soft"}>{status ? "Configuré" : "À configurer"}</span></li>)}</ul><p className="mt-4 text-xs leading-relaxed text-ink-soft">Les clés se renseignent dans les variables serveur de Coolify. Ne les saisissez jamais dans la conversation. « Configuré » signifie renseigné ; la connexion sera vérifiée au premier échange.</p></section>
        <section className="rounded-2xl border border-sand bg-cream p-5"><h2 className="text-lg font-bold">Pour démarrer</h2><ol className="mt-3 list-inside list-decimal space-y-3 text-sm leading-relaxed"><li>Activez la facturation API et créez une clé sur <a className="underline" href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">OpenAI</a>.</li><li>Renseignez OPENAI_API_KEY et ASSISTANT_ENABLED=true dans Coolify, puis redéployez.</li><li>Testez ici une consultation de commande.</li><li>Connectez ensuite l’application WhatsApp Business et votre numéro autorisé.</li></ol></section>
        <p className="px-1 text-xs leading-relaxed text-ink-soft">Estimation en dollars, hors taxes, WhatsApp et hébergement. La limite porte sur les demandes IA, pas sur un montant en euros. Historique privé conservé jusqu’à 30 jours avec la tâche de nettoyage configurée. Les données nécessaires à votre demande sont transmises à OpenAI.</p>
        {overview.recent.length > 0 && <section className="rounded-2xl border border-sand bg-cream p-5"><h2 className="font-bold">Dernières demandes</h2><ul className="mt-3 space-y-3 text-xs">{overview.recent.map(r => <li key={r.id}>{new Date(r.created).toLocaleString("fr-FR")} · {r.channel}<br /><span className="font-semibold">{({ queued: "En attente", processing: "En cours / à vérifier si interrompu", done: "Terminée", failed: "Échec", sent: "Réponse WhatsApp envoyée", delivery_uncertain: "Envoi WhatsApp à vérifier", blocked: "Numéro non autorisé" } as Record<string, string>)[r.state] || r.state}</span></li>)}</ul></section>}
      </aside>
    </div>
  </>;
}
