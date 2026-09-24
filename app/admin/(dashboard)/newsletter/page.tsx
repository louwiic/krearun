import NewsletterComposer from "@/components/admin/NewsletterComposer";
import { formatDate } from "@/lib/format";
import { getSubscribers } from "@/lib/store";
import { getOrders } from "@/lib/store";
import { newsletterRecipients } from "@/lib/newsletter-targeting";
import { deleteSubscriberAction, setSubscriberIgnoredAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage() {
  const [subscribers, orders] = await Promise.all([getSubscribers(), getOrders()]);
  const active = subscribers.filter((contact) => !contact.ignored);
  const emails = active.map((s) => s.email).join(", ");
  const segmentCounts = {
    all: newsletterRecipients(subscribers, orders, "all").length,
    recent: newsletterRecipients(subscribers, orders, "recent").length,
    older: newsletterRecipients(subscribers, orders, "older").length,
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-terra">Communication</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Newsletter</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Créez, prévisualisez et envoyez vos nouvelles à vos abonnés.
          </p>
        </div>
        <div className="rounded-2xl border border-sand bg-cream px-4 py-3 text-right shadow-soft">
          <p className="text-2xl font-bold text-terra">{segmentCounts.all}</p>
          <p className="text-xs font-semibold text-ink-soft">contact{segmentCounts.all > 1 ? "s" : ""} actif{segmentCounts.all > 1 ? "s" : ""}</p>
        </div>
      </div>

      <NewsletterComposer contacts={subscribers.map(({ email, ignored }) => ({ email, ignored }))} segmentCounts={segmentCounts} />

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
              <p className="mt-2 select-all break-all rounded-2xl border border-sage/20 bg-cream p-4 font-mono text-xs text-ink-soft">{emails}</p>
            </div>
            <div className="mt-4 overflow-hidden rounded-blob bg-cream shadow-soft">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-sand/70 text-xs uppercase tracking-wide text-ink-faint">
                  <th className="px-5 py-4 font-bold">E-mail</th>
                  <th className="px-5 py-4 font-bold">Inscrit le</th>
                  <th className="px-5 py-4 font-bold">État</th>
                  <th className="px-5 py-4 font-bold">Actions</th>
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
                      <td className="px-5 py-3.5 text-ink-soft">{subscriber.ignored ? "Ignoré" : "Actif"}</td>
                      <td className="px-5 py-3.5"><div className="flex flex-wrap gap-2">
                        <form action={setSubscriberIgnoredAction}>
                          <input type="hidden" name="id" value={subscriber.id} />
                          <input type="hidden" name="ignored" value={String(!subscriber.ignored)} />
                          <button className="rounded-full border border-sand px-3 py-1 text-xs font-bold hover:border-terra">{subscriber.ignored ? "Réactiver" : "Ignorer"}</button>
                        </form>
                        <form action={deleteSubscriberAction}>
                          <input type="hidden" name="id" value={subscriber.id} />
                          <button className="rounded-full border border-blush px-3 py-1 text-xs font-bold text-terra hover:bg-blush/30">Supprimer</button>
                        </form>
                      </div></td>
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
