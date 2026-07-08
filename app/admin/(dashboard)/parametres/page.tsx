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
          <h2 className="mb-5 font-display text-lg font-semibold">Accueil</h2>
          <div className="grid gap-5">
            {settings.hero_image_url ? (
              <div>
                <span className={label}>Image actuelle du hero</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={settings.hero_image_url}
                  alt=""
                  className="aspect-[4/3] w-full max-w-sm rounded-2xl object-cover"
                />
              </div>
            ) : null}
            <label>
              <span className={label}>URL de l'image principale</span>
              <input
                name="hero_image_url"
                defaultValue={settings.hero_image_url}
                className={field}
                placeholder="/home/hero-monster-product.webp"
              />
            </label>
            <label>
              <span className={label}>Remplacer l'image principale</span>
              <input
                name="hero_image_file"
                type="file"
                accept="image/*"
                className="w-full rounded-2xl border border-dashed border-sand bg-linen px-4 py-4 text-sm"
              />
            </label>
            <label>
              <span className={label}>Texte alternatif</span>
              <input
                name="hero_image_alt"
                defaultValue={settings.hero_image_alt}
                className={field}
              />
            </label>
            <label>
              <span className={label}>Lien au clic</span>
              <input
                name="hero_link_url"
                defaultValue={settings.hero_link_url}
                className={field}
                placeholder="/boutique"
              />
            </label>
            <div className="border-t border-sand/70 pt-5">
              <h3 className="mb-4 font-display text-base font-semibold">Petit média superposé</h3>
              {settings.hero_secondary_media_url ? (
                <div className="mb-4 max-w-xs overflow-hidden rounded-2xl bg-ink shadow-soft">
                  {settings.hero_secondary_media_type === "video" ? (
                    <video
                      src={settings.hero_secondary_media_url}
                      className="aspect-video w-full object-cover"
                      controls
                      muted
                      playsInline
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={settings.hero_secondary_media_url}
                      alt=""
                      className="aspect-video w-full object-cover"
                    />
                  )}
                </div>
              ) : null}
              <div className="grid gap-5">
                <label>
                  <span className={label}>URL du petit média</span>
                  <input
                    name="hero_secondary_media_url"
                    defaultValue={settings.hero_secondary_media_url}
                    className={field}
                    placeholder="/home/hero-secondary-video.mp4"
                  />
                </label>
                <label>
                  <span className={label}>Type de média</span>
                  <select
                    name="hero_secondary_media_type"
                    defaultValue={settings.hero_secondary_media_type}
                    className={field}
                  >
                    <option value="image">Image</option>
                    <option value="video">Vidéo</option>
                  </select>
                </label>
                <label>
                  <span className={label}>Uploader/remplacer le petit média</span>
                  <input
                    name="hero_secondary_media_file"
                    type="file"
                    accept="image/*,video/mp4,video/webm,video/quicktime,video/*"
                    className="w-full rounded-2xl border border-dashed border-sand bg-linen px-4 py-4 text-sm"
                  />
                </label>
                <label>
                  <span className={label}>Texte alternatif du petit média</span>
                  <input
                    name="hero_secondary_media_alt"
                    defaultValue={settings.hero_secondary_media_alt}
                    className={field}
                  />
                </label>
                <label>
                  <span className={label}>Lien au clic du petit média</span>
                  <input
                    name="hero_secondary_link_url"
                    defaultValue={settings.hero_secondary_link_url}
                    className={field}
                    placeholder="/boutique"
                  />
                </label>
              </div>
            </div>
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
