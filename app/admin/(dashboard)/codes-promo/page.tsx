import { formatPrice } from "@/lib/format";
import {
  getPromotionCodes,
  promotionCoupon,
} from "@/lib/promotion-codes";
import { stripeConfigured } from "@/lib/stripe";
import {
  createPromotionCodeAction,
  togglePromotionCodeAction,
} from "./actions";

export const dynamic = "force-dynamic";

const field =
  "w-full rounded-2xl border border-sand bg-linen px-4 py-3 text-sm outline-none focus:border-terra";
const label = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-soft";

function formatDate(timestamp: number | null) {
  if (!timestamp) return "Sans expiration";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeZone: "Indian/Reunion",
  }).format(new Date(timestamp * 1000));
}

export default async function PromotionCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const messages = await searchParams;
  const stripeOk = stripeConfigured();
  const codes = stripeOk ? await getPromotionCodes() : [];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-terra">Ventes</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Codes promo</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Créez et pilotez les réductions utilisées dans le panier. Les codes sont synchronisés
          directement avec Stripe.
        </p>
      </div>

      {messages.success ? (
        <p className="mb-6 rounded-2xl bg-sage/20 px-5 py-4 text-sm font-semibold text-sage-deep">
          {messages.success}
        </p>
      ) : null}
      {messages.error ? (
        <p className="mb-6 rounded-2xl bg-blush/35 px-5 py-4 text-sm font-semibold text-terra-deep">
          {messages.error}
        </p>
      ) : null}

      {!stripeOk ? (
        <div className="rounded-blob bg-cream p-8 text-sm text-terra-deep shadow-soft">
          Stripe n’est pas configuré. Ajoutez d’abord la clé secrète Stripe au serveur.
        </div>
      ) : (
        <div className="grid gap-7 lg:grid-cols-[0.85fr_1.15fr]">
          <form action={createPromotionCodeAction} className="h-max rounded-blob bg-cream p-6 shadow-soft sm:p-7">
            <h2 className="font-display text-2xl font-semibold">Nouveau code</h2>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              La réduction s’applique une fois à la commande validée dans Stripe.
            </p>

            <div className="mt-6 grid gap-5">
              <label>
                <span className={label}>Code communiqué au client</span>
                <input
                  name="code"
                  required
                  minLength={3}
                  maxLength={50}
                  pattern="[A-Za-z0-9-]+"
                  className={`${field} uppercase`}
                  placeholder="BIENVENUE10"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className={label}>Type de réduction</span>
                  <select name="discount_type" className={field} defaultValue="percent">
                    <option value="percent">Pourcentage</option>
                    <option value="amount">Montant fixe</option>
                  </select>
                </label>
                <label>
                  <span className={label}>Valeur (% ou €)</span>
                  <input name="value" required type="number" min="0.01" max="10000" step="0.01" className={field} placeholder="10" />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className={label}>Date d’expiration</span>
                  <input name="expires_at" type="date" className={field} />
                </label>
                <label>
                  <span className={label}>Nombre maximal d’utilisations</span>
                  <input name="max_redemptions" type="number" min="1" step="1" className={field} placeholder="Illimité" />
                </label>
              </div>
              <label>
                <span className={label}>Montant minimum du panier (€)</span>
                <input name="minimum_amount" type="number" min="0" step="0.01" className={field} placeholder="Aucun minimum" />
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-sand bg-linen px-4 py-3 text-sm font-semibold">
                <input name="first_time_only" type="checkbox" className="h-4 w-4 accent-terra" />
                Réservé à la première commande
              </label>
              <button className="rounded-full bg-terra px-6 py-3.5 text-sm font-bold text-cream transition-colors hover:bg-terra-deep">
                Créer le code promo
              </button>
            </div>
          </form>

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-semibold">Codes existants</h2>
                <p className="mt-1 text-xs text-ink-faint">{codes.length} code{codes.length !== 1 ? "s" : ""} dans Stripe</p>
              </div>
            </div>

            {codes.length === 0 ? (
              <div className="rounded-blob bg-cream p-10 text-center text-sm text-ink-soft shadow-soft">
                Aucun code promotionnel pour le moment.
              </div>
            ) : (
              <div className="grid gap-4">
                {codes.map((code) => {
                  const coupon = promotionCoupon(code);
                  const discount = coupon?.percent_off
                    ? `${coupon.percent_off}%`
                    : coupon?.amount_off
                      ? formatPrice(coupon.amount_off)
                      : "Réduction Stripe";
                  const exhausted = Boolean(
                    code.max_redemptions && code.times_redeemed >= code.max_redemptions
                  );
                  const couponInvalid = coupon?.valid === false;
                  const usable = code.active && !exhausted && !couponInvalid;

                  return (
                    <article key={code.id} className="rounded-blob bg-cream p-5 shadow-soft sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display text-2xl uppercase tracking-wide">{code.code}</h3>
                            <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${usable ? "bg-sage/25 text-sage-deep" : "bg-blush/35 text-terra-deep"}`}>
                              {usable ? "Actif" : exhausted ? "Épuisé" : couponInvalid ? "Expiré" : "Inactif"}
                            </span>
                          </div>
                          <p className="mt-2 text-2xl font-bold text-terra">− {discount}</p>
                        </div>
                        <form action={togglePromotionCodeAction}>
                          <input type="hidden" name="id" value={code.id} />
                          <input type="hidden" name="active" value={code.active ? "false" : "true"} />
                          <button
                            disabled={exhausted || couponInvalid}
                            className="rounded-full border border-sand px-4 py-2 text-xs font-bold text-ink-soft hover:border-terra hover:text-terra disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {code.active ? "Désactiver" : "Réactiver"}
                          </button>
                        </form>
                      </div>
                      <div className="mt-5 grid gap-2 border-t border-sand/70 pt-4 text-xs text-ink-soft sm:grid-cols-2">
                        <p>Expiration : <strong>{formatDate(code.expires_at)}</strong></p>
                        <p>Utilisations : <strong>{code.times_redeemed}{code.max_redemptions ? ` / ${code.max_redemptions}` : " / illimité"}</strong></p>
                        <p>Panier minimum : <strong>{code.restrictions.minimum_amount ? formatPrice(code.restrictions.minimum_amount) : "Aucun"}</strong></p>
                        <p>Première commande : <strong>{code.restrictions.first_time_transaction ? "Oui" : "Non"}</strong></p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
