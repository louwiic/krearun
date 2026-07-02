import { getSettings } from "@/lib/store";
import { saveSettingsAction } from "@/app/admin/actions";
import { stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const field =
  "w-full rounded-2xl border border-sand bg-linen px-4 py-3 text-sm outline-none focus:border-terra";
const label = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-soft";

export default async function AdminParametresPage() {
  const settings = await getSettings();
  const stripeOk = stripeConfigured();
  const webhookOk = Boolean(process.env.STRIPE_WEBHOOK_SECRET);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 font-display text-3xl font-semibold">Réglages</h1>

      <form action={saveSettingsAction} className="space-y-6">
        <div className="rounded-blob bg-cream p-7 shadow-soft">
          <h2 className="mb-5 font-display text-lg font-semibold">Boutique</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <label>
              <span className={label}>Nom de la boutique</span>
              <input name="store_name" defaultValue={settings.store_name} className={field} />
            </label>
            <label>
              <span className={label}>E-mail de contact</span>
              <input name="contact_email" type="email" defaultValue={settings.contact_email} className={field} />
            </label>
            <label className="sm:col-span-2">
              <span className={label}>Bandeau d'annonce (vide = masqué)</span>
              <input name="announcement" defaultValue={settings.announcement} className={field} placeholder="✿ Livraison offerte dès 60 €" />
            </label>
            <label className="sm:col-span-2">
              <span className={label}>Instagram (URL)</span>
              <input name="instagram" defaultValue={settings.instagram} className={field} placeholder="https://instagram.com/…" />
            </label>
          </div>
        </div>

        <div className="rounded-blob bg-cream p-7 shadow-soft">
          <h2 className="mb-5 font-display text-lg font-semibold">Livraison</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <label>
              <span className={label}>Frais de port (€)</span>
              <input
                name="shipping_flat"
                type="number"
                step="0.01"
                min="0"
                defaultValue={(settings.shipping_flat_cents / 100).toFixed(2)}
                className={field}
              />
            </label>
            <label>
              <span className={label}>Livraison offerte à partir de (€)</span>
              <input
                name="free_shipping_threshold"
                type="number"
                step="0.01"
                min="0"
                defaultValue={(settings.free_shipping_threshold_cents / 100).toFixed(2)}
                className={field}
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-full bg-terra px-10 py-3.5 text-sm font-bold text-cream transition-colors hover:bg-terra-deep"
          >
            Enregistrer
          </button>
        </div>
      </form>

      <div className="mt-10 rounded-blob bg-cream p-7 shadow-soft">
        <h2 className="mb-4 font-display text-lg font-semibold">Paiements Stripe</h2>
        <div className="mb-5 flex flex-wrap gap-3 text-xs font-bold">
          <span className={`rounded-full px-4 py-2 ${stripeOk ? "bg-sage/30 text-sage-deep" : "bg-blush/40 text-terra-deep"}`}>
            {stripeOk ? "● Clé API configurée" : "○ Clé API manquante"}
          </span>
          <span className={`rounded-full px-4 py-2 ${webhookOk ? "bg-sage/30 text-sage-deep" : "bg-blush/40 text-terra-deep"}`}>
            {webhookOk ? "● Webhook configuré" : "○ Webhook manquant"}
          </span>
        </div>
        <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-ink-soft">
          <li>
            Récupère tes clés sur{" "}
            <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer" className="font-bold text-terra underline">
              dashboard.stripe.com/apikeys
            </a>{" "}
            et renseigne <code className="rounded bg-linen px-1.5 py-0.5">STRIPE_SECRET_KEY</code> et{" "}
            <code className="rounded bg-linen px-1.5 py-0.5">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> dans le fichier{" "}
            <code className="rounded bg-linen px-1.5 py-0.5">.env</code> à la racine du projet.
          </li>
          <li>
            Pour recevoir les commandes automatiquement, crée un webhook vers{" "}
            <code className="rounded bg-linen px-1.5 py-0.5">/api/stripe/webhook</code>{" "}
            (événement <code className="rounded bg-linen px-1.5 py-0.5">checkout.session.completed</code>) et renseigne{" "}
            <code className="rounded bg-linen px-1.5 py-0.5">STRIPE_WEBHOOK_SECRET</code>.
            En local : <code className="rounded bg-linen px-1.5 py-0.5">stripe listen --forward-to localhost:3000/api/stripe/webhook</code>
          </li>
          <li>Redémarre le serveur (<code className="rounded bg-linen px-1.5 py-0.5">npm run dev</code>) — et c'est tout ✿</li>
        </ol>
      </div>
    </div>
  );
}
