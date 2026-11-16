"use client";

import { REWARDS, findReward, rewardDiscount } from "@/lib/rewards";
import { formatPrice } from "@/lib/format";
import CouponIllustration from "./CouponIllustration";
import { useCart } from "./CartContext";

export default function CartRewards({ onSelect }: { onSelect?: () => void }) {
  const { subtotalCents, rewardCode, selectReward, rewardDiscountCents } = useCart();
  const next = REWARDS.find(reward => reward.maximumCents === null && subtotalCents < reward.minimumCents);
  const selected = findReward(rewardCode);
  return <section className="rounded-2xl border border-sand bg-cream p-4" aria-label="Mes récompenses">
    <h3 className="font-display text-lg font-semibold">✦ Mes récompenses</h3>
    <p className="mt-1 text-xs text-ink-soft">Un petit plus pour vos créations.</p>
    {next ? <div className="mt-3">
      <p className="text-sm">Encore {formatPrice(next.minimumCents - subtotalCents)} pour débloquer {formatPrice(next.amountCents)}.</p>
      <progress aria-label={`Progression vers ${formatPrice(next.amountCents)} de réduction`} className="mt-2 h-2 w-full accent-terra" value={Math.min(subtotalCents, next.minimumCents)} max={next.minimumCents} />
    </div> : <p className="mt-3 text-sm font-semibold">Votre récompense de 2 € est disponible !</p>}
    <div className="mt-3 grid gap-2">
      {REWARDS.map(reward => {
        const unlocked = rewardDiscount(reward.code, subtotalCents) > 0;
        const active = rewardCode === reward.code && unlocked;
        return <button type="button" key={reward.code} disabled={!unlocked} aria-pressed={active} onClick={() => { onSelect?.(); selectReward(active ? "" : reward.code); }} className={`flex items-center gap-2 rounded-2xl border px-2 py-3 text-left text-sm transition-colors enabled:hover:border-terra disabled:opacity-60 ${active ? "border-terra bg-terra/10" : "border-sand"}`}>
          <CouponIllustration amountCents={reward.amountCents} />
          <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1"><strong>−{formatPrice(reward.amountCents)}</strong><span>{active ? "✓ Appliquée · retirer" : unlocked ? "Utiliser" : reward.maximumCents !== null && subtotalCents > reward.maximumCents ? "Hors plafond" : "À débloquer"}</span></span>
          <span className="mt-1 block text-xs">{reward.title}<span className="mt-1 block text-ink-soft">{reward.condition}</span></span>
          </span>
        </button>;
      })}
    </div>
    {selected && !rewardDiscountCents && <p role="status" className="mt-2 text-xs text-ink-soft">Votre récompense est en pause : le panier ne remplit pas ses conditions.</p>}
    <p className="mt-3 text-[11px] text-ink-soft">Une récompense ou un code promo par commande. Seuils hors livraison, après remises automatiques. Choix conservé sur cet appareil.</p>
  </section>;
}
