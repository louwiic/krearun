"use client";

import { useActionState, useState } from "react";
import { saveSiteSkinAction } from "@/app/admin/(dashboard)/parametres/skin/actions";
import { SITE_SKINS, isSiteSkin, type SiteSkin } from "@/lib/site-skins";
import SeasonalSkinBanner from "@/components/site/SeasonalSkinBanner";

export default function SiteSkinSettings({ skin, enabled }: { skin: string; enabled: boolean }) {
  const [selected, setSelected] = useState<SiteSkin>(isSiteSkin(skin) ? skin : "default");
  const [active, setActive] = useState(enabled);
  const [dirty, setDirty] = useState(false);
  const [state, action, pending] = useActionState(saveSiteSkinAction, {});
  return <section id="apparence" className="mb-8 scroll-mt-6 rounded-blob border border-sand bg-cream p-5 shadow-soft sm:p-7">
    <h2 className="font-display text-xl font-semibold">Apparence et skins</h2>
    <p className="mt-2 text-sm text-ink-soft">Choisissez un habillage pour la boutique. Désactivez-le à tout moment pour retrouver la charte Kréarun.</p>
    <form action={async form => { await action(form); setDirty(false); }} className="mt-5 space-y-5">
      <fieldset><legend className="mb-3 text-sm font-bold">Choisir un skin</legend><div className="grid gap-3 sm:grid-cols-2">
        {SITE_SKINS.map(option => <label key={option.id} className={`cursor-pointer rounded-2xl border-2 p-4 transition-colors ${selected === option.id ? "border-ink bg-linen" : "border-sand bg-white"}`}>
          <span className="flex items-center gap-3"><input type="radio" name="site_skin" value={option.id} checked={selected === option.id} onChange={() => { setSelected(option.id); setDirty(true); }} className="h-4 w-4 accent-ink"/><span className="font-bold">{option.name}</span></span>
          <span className="mt-3 flex gap-2" aria-hidden="true">{(option.id === "halloween" ? ["#28132e", "#ff9b46", "#f9eddf", "#d9c6ec"] : ["#171717", "#ff6b35", "#f6f3ee", "#b9dff2"]).map(color => <span key={color} className="h-6 w-6 rounded-full border border-black/15" style={{ backgroundColor: color }}/>)}</span>
          <span className="mt-3 block text-xs leading-relaxed text-ink-soft">{option.description}</span>
        </label>)}
      </div></fieldset>
      <label className="flex cursor-pointer items-center gap-3 text-sm font-bold"><input type="checkbox" name="site_skin_enabled" checked={active} onChange={event => { setActive(event.target.checked); setDirty(true); }} className="h-5 w-5 accent-ink"/>Activer le skin sélectionné sur la boutique</label>
      <div><p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Aperçu du skin sélectionné</p>
        <div className="storefront overflow-hidden rounded-xl border border-sand bg-linen p-4 text-ink" data-site-skin={selected}>
          {selected === "halloween" && <SeasonalSkinBanner />}
          <div className="rounded-xl bg-cream p-4"><p className="font-display text-xl">Vos idées prennent forme.</p><p className="mt-2 text-sm text-ink-soft">Vos photos, vos créations, une ambiance à votre image.</p><span className="mt-3 inline-block rounded-lg bg-terra px-4 py-2 text-sm font-bold text-ink">Découvrir la boutique</span></div>
        </div>
        <p className="mt-2 text-xs text-ink-soft">{active ? "L’habillage sélectionné sera appliqué après enregistrement." : "Skin désactivé : la boutique conserve la charte habituelle. L’aperçu reste visible ici."}</p>
      </div>
      <button type="submit" disabled={pending} className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{pending ? "Enregistrement…" : "Enregistrer l’apparence"}</button>
      <p role="status" className="text-sm text-ink-soft">{pending ? "Enregistrement en cours…" : dirty ? "Modifications à enregistrer." : state.error || (state.saved ? "Apparence enregistrée. Le réglage est appliqué à la boutique." : "")}</p>
    </form>
  </section>;
}
