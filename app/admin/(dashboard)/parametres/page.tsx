import HomeHighlightSettings from "@/components/admin/HomeHighlightSettings";
import { parseHomeHighlight } from "@/lib/home-highlight";
import SiteSkinSettings from "@/components/admin/SiteSkinSettings";
import { DEFAULT_METROPOLITAN_SHIPPING } from "@/lib/metropolitan-shipping";
import { getProducts, getSettings } from "@/lib/store";
import { saveSettingsAction } from "@/app/admin/actions";
import { stripeConfigured } from "@/lib/stripe";
import { DEFAULT_REUNION_SHIPPING_RATES } from "@/lib/shipping";
import { DEFAULT_PICKUP_POINTS, parsePickupPoints } from "@/lib/pickup";

export const dynamic = "force-dynamic";

const field =
  "w-full rounded-2xl border border-sand bg-linen px-4 py-3 text-sm outline-none focus:border-terra";
const label = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-soft";

export default async function AdminParametresPage() {
  const [settings, products] = await Promise.all([
    getSettings(),
    getProducts({ includeInactive: true }),
  ]);
  const stripeOk = stripeConfigured();
  const webhookOk = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  const pickupPoints = parsePickupPoints(settings.pickup_points_json, { includeInactive: true });
  const adminPickupPoints = DEFAULT_PICKUP_POINTS.map(
    (fallback) => pickupPoints.find((point) => point.id === fallback.id) ?? fallback
  );

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 font-display text-3xl font-semibold">Réglages</h1>

      <SiteSkinSettings skin={settings.site_skin} enabled={settings.site_skin_enabled} />

      <HomeHighlightSettings config={parseHomeHighlight(settings.homepage_highlight_json)} products={products.filter(p=>!p.privateSale).map(({slug,name,active})=>({slug,name,active}))} />

      <form action={saveSettingsAction} className="space-y-6">
        <div className="rounded-blob bg-cream p-7 shadow-soft">
          <h2 className="mb-5 font-display text-lg font-semibold">Rappels de panier</h2>
          <div className="space-y-4 text-sm">
            <label className="flex items-start gap-3"><input type="checkbox" name="cart_browser_reminder_enabled" defaultChecked={settings.cart_browser_reminder_enabled} className="mt-1" /><span>Rappel sur le site au retour dans le même navigateur après 30 minutes, si le panier contient encore des articles.</span></label>
            <label className="flex items-start gap-3"><input type="checkbox" name="cart_email_reminder_enabled" defaultChecked={settings.cart_email_reminder_enabled} className="mt-1" /><span>Proposer un rappel par email avec accord explicite et confirmation de l’adresse.</span></label>
            <p className="text-ink-soft">Un seul rappel, environ une heure après confirmation, annulé si un achat est confirmé. Désabonnement dans chaque email. Demandes et preuves d’accord conservées 30 jours, sans inscription à la newsletter. Les envois nécessitent l’exécution régulière du worker de rappels (ou du worker de l’assistant).</p>
          </div>
        </div>
        <div className="rounded-blob bg-cream p-7 shadow-soft">
          <h2 className="mb-3 font-display text-lg font-semibold">Accueil — Bandeau Offre express</h2>
          <p className="mb-5 text-sm text-ink-soft">Présentez un code promo, un cadeau ou une offre sur plusieurs articles. Les champs ci-dessous personnalisent aussi l’offre porte-clés dans le panier. Le cadeau prénom est enregistré automatiquement dans la commande payée ; les autres remises restent à configurer dans les outils de vente correspondants.</p>
          <div className="grid gap-5">
            <label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" name="cart_name_gift_enabled" defaultChecked={settings.cart_name_gift_enabled} />Offrir un porte-clés prénom dans le panier (un par commande payée)</label>
            <label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" name="express_offer_enabled" defaultChecked={settings.express_offer_enabled} />Afficher sous la grande bannière, avant le premier produit</label>
            <label><span className={label}>Titre / texte de l’offre</span><input name="express_offer_title" maxLength={100} defaultValue={settings.express_offer_title} className={field} placeholder="Votre offre express" /></label>
            <label><span className={label}>Description</span><textarea name="express_offer_description" maxLength={300} rows={3} defaultValue={settings.express_offer_description} className={field} placeholder="Conditions, code promo ou détails du cadeau" /></label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label><span className={label}>Texte du bouton (CTA)</span><input name="express_offer_cta" maxLength={60} defaultValue={settings.express_offer_cta} className={field} /></label>
              <label><span className={label}>Lien du bouton</span><input name="express_offer_href" defaultValue={settings.express_offer_href} className={field} placeholder="/boutique ou /panier" /></label>
            </div>
            <label><span className={label}>URL de la petite photo (vide = sans photo)</span><input name="express_offer_image" defaultValue={settings.express_offer_image} className={field} /></label>
            <label><span className={label}>Importer / remplacer la photo</span><input type="file" name="express_offer_image_file" accept="image/*" className={field} /></label>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {settings.express_offer_image && <img src={settings.express_offer_image} alt="Photo du bandeau actuel" className="h-20 w-20 rounded-xl object-cover" />}
          </div>
        </div>

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
              <span className={label}>Bandeau d’annonce (vide = masqué)</span>
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
            <div className="grid gap-5 sm:grid-cols-2">
              <label>
                <span className={label}>Mode de la page d’accueil</span>
                <select
                  name="homepage_mode"
                  defaultValue={settings.homepage_mode}
                  className={field}
                >
                  <option value="single_product">Produit vedette</option>
                  <option value="catalog">Vitrine classique</option>
                </select>
              </label>
              <label>
                <span className={label}>Produit vedette</span>
                <select
                  name="homepage_featured_product_slug"
                  defaultValue={settings.homepage_featured_product_slug}
                  className={field}
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.slug}>
                      {product.name}{product.active ? "" : " — masqué"}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="text-xs leading-relaxed text-ink-faint">
              En mode produit vedette, l’accueil met en avant le modèle sélectionné dans
              un grand bloc photo avec ses options et l’ajout direct au panier.
            </p>
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
              <span className={label}>URL de l’image principale</span>
              <input
                name="hero_image_url"
                defaultValue={settings.hero_image_url}
                className={field}
                placeholder="/home/hero-monster-product.webp"
              />
            </label>
            <label>
              <span className={label}>Remplacer l’image principale</span>
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
              <span className={label}>Ancien forfait de secours (€)</span>
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
            <label className="sm:col-span-2">
              <span className={label}>Grille d’envoi à domicile — La Réunion</span>
              <textarea
                name="shipping_rates_json"
                rows={8}
                defaultValue={
                  settings.shipping_rates_json ||
                  JSON.stringify(DEFAULT_REUNION_SHIPPING_RATES, null, 2)
                }
                className={`${field} font-mono text-xs`}
              />
              <span className="mt-1 block text-xs text-ink-faint">
                Lettre Services Plus (suivi inclus). Format JSON. `priceCents` est en centimes. Mettez le seuil de gratuité à 0 pour toujours calculer les frais par poids.
              </span>
            </label>
            <div className="sm:col-span-2"><label><span className={label}>La Réunion → France métropolitaine — sans signature</span><textarea name="metropolitan_shipping_rates_json" rows={12} defaultValue={settings.metropolitan_shipping_rates_json || JSON.stringify(DEFAULT_METROPOLITAN_SHIPPING, null, 2)} className={`${field} font-mono text-xs`} /></label><p className="mt-2 text-xs text-ink-soft">Prix client en centimes, poids emballés en grammes, jusqu’à 30 kg. Grille reprise sans majoration le 21 octobre 2026 de la base transporteur HT fournie. Aucun taux de TVA, CAE ou supplément non confirmé n’est ajouté automatiquement. Modifiez la version lorsque vous ajustez la grille. Le coût transporteur réel peut différer ; comparez votre première facture.</p></div>
            <div className="sm:col-span-2">
              <span className={label}>Points de retrait</span>
              <div className="space-y-4">
                {adminPickupPoints.map((point, index) => (
                  <div key={point.id || index} className="rounded-2xl border border-sand bg-linen p-4">
                    <input type="hidden" name={`pickup_id_${index}`} defaultValue={point.id} />
                    <div className="mb-4 flex items-center gap-3">
                      <input
                        id={`pickup_active_${index}`}
                        name={`pickup_active_${index}`}
                        type="checkbox"
                        defaultChecked={point.active}
                        className="h-4 w-4 accent-terra"
                      />
                      <label htmlFor={`pickup_active_${index}`} className="text-sm font-bold">
                        Afficher ce point au client
                      </label>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label>
                        <span className={label}>Nom du point</span>
                        <input name={`pickup_name_${index}`} defaultValue={point.name} className={field} />
                      </label>
                      <label>
                        <span className={label}>Créneau</span>
                        <input name={`pickup_schedule_${index}`} defaultValue={point.schedule} className={field} />
                      </label>
                      <label className="sm:col-span-2">
                        <span className={label}>Adresse / secteur</span>
                        <input name={`pickup_address_${index}`} defaultValue={point.address} className={field} />
                      </label>
                      <label className="sm:col-span-2">
                        <span className={label}>Note client</span>
                        <input name={`pickup_note_${index}`} defaultValue={point.note} className={field} />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <span className="mt-2 block text-xs text-ink-faint">
                Le retrait est gratuit. Décochez un point pour le masquer sans le supprimer.
              </span>
            </div>
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
          <li>Redémarre le serveur (<code className="rounded bg-linen px-1.5 py-0.5">npm run dev</code>) — et c’est tout ✿</li>
        </ol>
      </div>
    </div>
  );
}
