"use client";

import { useState } from "react";

export default function HolderPaymentShare({ url, email, initialMessage }: {
  url: string;
  email: string;
  initialMessage: string;
}) {
  const [message, setMessage] = useState(initialMessage);
  const [notice, setNotice] = useState("");

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${label} copié.`);
    } catch {
      setNotice("La copie automatique est indisponible. Sélectionnez le texte dans le champ pour le copier.");
    }
  }

  return <section className="mt-5 rounded-xl border border-sand bg-white p-5" aria-label="Partager le paiement au client">
    <h3 className="font-display text-xl">Envoyer le lien au client</h3>
    <p className="mt-2 text-sm text-ink-soft">Le client se connecte à son compte, accepte les conditions et règle sa demande validée.</p>
    <label className="mt-4 block text-sm font-bold">Lien de la demande
      <input readOnly value={url} onFocus={event => event.currentTarget.select()} className="mt-2 w-full rounded-xl border border-sand bg-linen px-3 py-2 text-sm font-normal" />
    </label>
    <button type="button" onClick={() => void copy(url, "Lien")} className="mt-3 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white">Copier le lien client</button>
    <label className="mt-5 block text-sm font-bold">Message à envoyer — modifiable
      <textarea value={message} onChange={event => setMessage(event.target.value)} rows={11} className="mt-2 w-full rounded-xl border border-sand bg-linen px-3 py-2 text-sm font-normal" />
    </label>
    <p className="mt-2 break-all text-xs text-ink-soft">Destinataire : {email}</p>
    <div className="mt-3 flex flex-wrap gap-3">
      <button type="button" onClick={() => void copy(message, "Message")} className="rounded-full border border-sand px-4 py-2 text-sm font-bold">Copier le message</button>
      <a href={`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Votre porte-boisson personnalisé est prêt à être réglé")}&body=${encodeURIComponent(message)}`} className="rounded-full border border-sand px-4 py-2 text-sm font-bold">Préparer l’e-mail</a>
    </div>
    <p role="status" className="mt-3 text-sm text-ink-soft">{notice}</p>
  </section>;
}
