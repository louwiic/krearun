import Link from "next/link";
import { getContactMessage, getContactMessages, isContactInboxConfigured } from "@/lib/contact-inbox";

export const dynamic = "force-dynamic";

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Indian/Reunion",
  }).format(new Date(value));
}

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ uid?: string }>;
}) {
  const { uid } = await searchParams;
  const configured = isContactInboxConfigured();
  let error = "";
  let messages: Awaited<ReturnType<typeof getContactMessages>> = [];
  let selected: Awaited<ReturnType<typeof getContactMessage>> = null;

  if (configured) {
    try {
      [messages, selected] = await Promise.all([
        getContactMessages(),
        uid && /^\d+$/.test(uid) ? getContactMessage(Number(uid)) : Promise.resolve(null),
      ]);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "Impossible de lire la boîte contact.";
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-terra">contact@krearun.re</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">Boîte de réception</h1>
          <p className="mt-2 text-sm text-ink-soft">Lecture seule · les messages restent sur le serveur mail.</p>
        </div>
        <Link href="/admin/messages" className="rounded-full border border-sand bg-cream px-4 py-2 text-sm font-semibold hover:border-ink">Actualiser</Link>
      </div>

      {!configured ? (
        <section className="rounded-blob bg-cream p-7 shadow-soft">
          <h2 className="font-display text-xl font-semibold">Connexion IMAP manquante</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">Ajoutez les variables <code>CONTACT_IMAP_*</code> dans Coolify puis redéployez l’application.</p>
        </section>
      ) : error ? (
        <section className="rounded-blob border border-blush bg-cream p-7 shadow-soft">
          <h2 className="font-display text-xl font-semibold">Impossible de lire la boîte</h2>
          <p className="mt-3 text-sm text-terra-deep">{error}</p>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <section className="rounded-blob bg-cream p-5 shadow-soft">
            <h2 className="mb-4 font-display text-xl font-semibold">Derniers messages</h2>
            {messages.length === 0 ? <p className="text-sm text-ink-soft">Aucun message.</p> : (
              <ul className="divide-y divide-sand/60">
                {messages.map((message) => (
                  <li key={message.uid}>
                    <Link href={`/admin/messages?uid=${message.uid}`} className={`block py-4 transition hover:bg-linen ${message.unread ? "font-semibold" : ""}`}>
                      <p className="truncate text-sm">{message.subject}</p>
                      <p className="mt-1 truncate text-xs text-ink-soft">{message.from}</p>
                      <p className="mt-1 text-[11px] text-ink-faint">{dateLabel(message.date)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="min-h-80 rounded-blob bg-white p-6 shadow-soft">
            {selected ? (
              <>
                <h2 className="font-display text-2xl font-semibold">{selected.subject}</h2>
                <dl className="mt-4 space-y-1 border-b border-sand/60 pb-4 text-xs text-ink-soft">
                  <div><dt className="inline font-bold">De :</dt> <dd className="inline">{selected.from}</dd></div>
                  <div><dt className="inline font-bold">À :</dt> <dd className="inline">{selected.to}</dd></div>
                  <div><dt className="inline font-bold">Date :</dt> <dd className="inline">{dateLabel(selected.date)}</dd></div>
                </dl>
                <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-ink">{selected.text || "(Message sans contenu texte)"}</div>
              </>
            ) : <p className="text-sm text-ink-soft">Sélectionnez un message pour le lire.</p>}
          </section>
        </div>
      )}
    </div>
  );
}
