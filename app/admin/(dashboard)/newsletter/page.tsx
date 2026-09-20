import NewsletterComposer from "@/components/admin/NewsletterComposer";
import { formatDate } from "@/lib/format";
import { getSubscribers } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage() {
  const subscribers = await getSubscribers();
  const emails = subscribers.map((s) => s.email).join(", ");

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="font-display text-3xl font-semibold">Newsletter</h1>
      <p className="mb-8 mt-1 text-sm text-ink-soft">
        Créez, prévisualisez et envoyez vos nouvelles à {subscribers.length} abonné
        {subscribers.length > 1 ? "s" : ""}.
      </p>

      <NewsletterComposer subscriberCount={subscribers.length} />

      <section className="mt-8">
        <h2 className="font-display text-2xl font-semibold">Liste des abonnés</h2>
        {subscribers.length === 0 ? (
          <div className="mt-4 rounded-blob bg-cream p-10 text-center shadow-soft">
            <p className="font-display text-xl">Personne pour l&apos;instant</p>
            <p className="mt-2 text-sm text-ink-soft">Les inscriptions de la boutique apparaîtront ici.</p>
          </div>
        ) : (
          <>
            <div className="mt-4 rounded-blob bg-sage/15 p-5 text-sm">
              <p className="font-bold">Copier la liste</p>
              <p className="mt-2 select-all break-all rounded-2xl bg-cream p-4 font-mono text-xs text-ink-soft">{emails}</p>
            </div>
            <div className="mt-4 overflow-hidden rounded-blob bg-cream shadow-soft">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-sand/70 text-xs uppercase tracking-wide text-ink-faint">
                  <th className="px-5 py-4 font-bold">E-mail</th>
                  <th className="px-5 py-4 font-bold">Inscrit le</th>
                </tr>
              </thead>
              <tbody>
                {subscribers
                  .slice()
                  .reverse()
                  .map((subscriber) => (
                    <tr key={subscriber.email} className="border-b border-sand/40 last:border-0">
                      <td className="px-5 py-3.5 font-semibold">{subscriber.email}</td>
                      <td className="px-5 py-3.5 text-ink-soft">{formatDate(subscriber.createdAt)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
