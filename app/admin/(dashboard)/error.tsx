"use client";
export default function AdminActionError({ reset }: { error: Error; reset: () => void }) {
  return <div className="rounded-2xl border border-sand bg-white p-6"><h2 className="font-display text-2xl">L’action n’a pas abouti</h2><p role="alert" className="mt-3 text-sm text-red-800">Une erreur est survenue. Rechargez les données et vérifiez le résultat avant de relancer l’action.</p><button type="button" onClick={reset} className="mt-5 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white">Recharger les données</button></div>;
}
