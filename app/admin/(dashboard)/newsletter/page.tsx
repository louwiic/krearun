import { getSubscribers } from "@/lib/store";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage() {
  const subscribers = await getSubscribers();
  const emails = subscribers.map((s) => s.email).join(", ");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-semibold">Newsletter</h1>
      <p className="mb-8 mt-1 text-sm text-ink-soft">
        {subscribers.length} abonné{subscribers.length > 1 ? "s" : ""} à vos
        douces nouvelles
      </p>

      {subscribers.length === 0 ? (
        <div className="rounded-blob bg-cream p-14 text-center shadow-soft">
          <p className="font-display text-xl">Personne pour l'instant</p>
          <p className="mt-2 text-sm text-ink-soft">
            Le formulaire d'inscription est en bas de chaque page de la
            boutique. ✿
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-blob bg-sage/15 p-6 text-sm">
            <p className="font-bold">Copier la liste (pour votre outil d'e-mailing)</p>
            <p className="mt-2 select-all break-all rounded-2xl bg-cream p-4 font-mono text-xs text-ink-soft">
              {emails}
            </p>
          </div>
          <div className="overflow-hidden rounded-blob bg-cream shadow-soft">
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
                  .map((s) => (
                    <tr key={s.email} className="border-b border-sand/40 last:border-0">
                      <td className="px-5 py-3.5 font-semibold">{s.email}</td>
                      <td className="px-5 py-3.5 text-ink-soft">{formatDate(s.createdAt)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
