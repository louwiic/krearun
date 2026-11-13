"use client";
/* eslint-disable @next/next/no-img-element -- vignettes produits déjà optimisées (R2). */
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { formatPrice } from "@/lib/format";
import { CATEGORIES } from "@/lib/types";
import { LIVE_AVATARS, cssColor, type LiveAction } from "@/lib/live-avatars";
import { clearLiveGuidedState, liveAvatarChoice, liveSelfId, setLiveAvatarChoice, setLiveGuidedState } from "@/lib/live-presence";
import type { HotspotKey } from "./LiveShop3D";

export type LiveVisitor = {
  id: string;
  seed: number;
  name: string;
  emoji: string;
  zone: string;
  action: LiveAction | null;
  avatar: number;
  product: { name: string; image: string; slug: string } | null;
  sinceSeconds: number;
};

type Suggestion = {
  id: string; slug: string; name: string; image: string; priceCents: number;
  color: string; stock: number; weightGrams: number; preorder?: boolean; simple: boolean;
};

type Step = "spectate" | "shop" | "checkout";
type Sheet = null | { kind: "avatar" } | { kind: "categories" } | { kind: "suggestions"; category: string; label: string };

const LiveShop3D = dynamic(() => import("./LiveShop3D"), {
  ssr: false,
  loading: () => <div className="flex h-[62svh] min-h-96 w-full items-center justify-center rounded-3xl border-2 border-ink/10 bg-linen-deep/40 text-sm text-ink-soft">Ouverture de la boutique…</div>,
});

function AvatarPreview({ index, size = "h-16 w-12" }: { index: number; size?: string }) {
  const look = LIVE_AVATARS[index];
  return (
    <span className={`flex ${size} flex-col items-center justify-end gap-0.5`}>
      <span className="h-1.5 w-6 rounded-sm" style={{ background: cssColor(look.hat) }} />
      <span className="h-4 w-4 rounded-full" style={{ background: cssColor(look.skin) }} />
      <span className="h-6 w-7 rounded-md" style={{ background: cssColor(look.outfit) }} />
      <span className="h-2.5 w-5 rounded-sm bg-ink/80" />
    </span>
  );
}

export default function LiveShop() {
  const { addItem, count: cartCount, openCart, closeCart } = useCart();
  const [visitors, setVisitors] = useState<LiveVisitor[] | null>(null);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [printing, setPrinting] = useState(0);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("spectate");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [selfZone, setSelfZone] = useState<string | null>(null);
  const [selfAction, setSelfAction] = useState<LiveAction | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [hint, setHint] = useState<string | null>(null);
  const checkoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let stopped = false;
    // Recalculé quand le consentement audience change (bandeau confidentialité).
    const computeSelf = () => { liveSelfId().then(id => { if (!stopped && id) setSelfId(id); }).catch(() => {}); };
    computeSelf();
    window.addEventListener("krearun:privacy-change", computeSelf);
    window.addEventListener("storage", computeSelf);
    async function refresh() {
      try {
        const response = await fetch("/api/presence", { cache: "no-store", signal: AbortSignal.timeout(5000) });
        if (!response.ok) return;
        const data = await response.json();
        if (stopped) return;
        if (Array.isArray(data.visitors)) {
          setVisitors(data.visitors);
          setTotalVisitors(typeof data.total === "number" ? data.total : data.visitors.length);
        }
        if (typeof data.workshop?.printing === "number") setPrinting(data.workshop.printing);
      } catch {}
    }
    refresh();
    const interval = setInterval(refresh, 4000);
    return () => {
      stopped = true;
      clearInterval(interval);
      window.removeEventListener("krearun:privacy-change", computeSelf);
      window.removeEventListener("storage", computeSelf);
      clearLiveGuidedState();
      if (checkoutTimer.current) clearTimeout(checkoutTimer.current);
    };
  }, []);

  const guide = useCallback((zone: string | null, action: LiveAction | null) => {
    setLiveGuidedState({ zone, action });
    setSelfZone(zone);
    setSelfAction(action);
  }, []);

  const ensureSelf = useCallback(async () => {
    if (selfId) return true;
    const id = await liveSelfId().catch(() => null);
    if (id) { setSelfId(id); setHint(null); return true; }
    setHint("Accepte les cookies de mesure d’audience (bandeau « Votre confidentialité ») pour entrer dans la boutique.");
    return false;
  }, [selfId]);

  async function enterShop() {
    if (!(await ensureSelf())) return;
    // Boutique pleine : les personnages affichés sont plafonnés à 50.
    if (totalVisitors > 50 && !(visitors ?? []).some(visitor => visitor.id === selfId)) {
      setHint("🚶🚶🚶 Faites la queue — il y a encore trop de gens dans la boutique virtuelle ! Réessayez dans un instant.");
      return;
    }
    if (liveAvatarChoice() === null) { setSheet({ kind: "avatar" }); return; }
    guide("rayons", null);
    setStep("shop");
    setSheet({ kind: "categories" });
  }
  function chooseAvatar(index: number) {
    setLiveAvatarChoice(index);
    guide("rayons", null);
    setStep("shop");
    setSheet({ kind: "categories" });
  }
  async function chooseCategory(category: string, label: string) {
    setSuggestions(null);
    setSheet({ kind: "suggestions", category, label });
    try {
      const response = await fetch(`/api/live-suggestions?categorie=${encodeURIComponent(category)}`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
      const data = response.ok ? await response.json() : { products: [] };
      setSuggestions(Array.isArray(data.products) ? data.products : []);
    } catch { setSuggestions([]); }
  }
  function quickAdd(product: Suggestion) {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      priceCents: product.priceCents,
      color: product.color,
      image: product.image,
      stock: product.stock,
      weightGrams: product.weightGrams,
      preorder: product.preorder,
    });
    // addItem ouvre le drawer panier : on reste dans le jeu, il s'ouvrira en caisse.
    closeCart();
    setAdded(previous => new Set(previous).add(product.id));
  }
  function goCheckout() {
    guide("caisse", null);
    setStep("checkout");
    setSheet(null);
    // Laisse le personnage marcher jusqu'à la caisse avant d'ouvrir le panier.
    if (checkoutTimer.current) clearTimeout(checkoutTimer.current);
    checkoutTimer.current = setTimeout(openCart, 1800);
  }
  function leaveShop() {
    guide(null, null);
    setStep("spectate");
    setSheet(null);
  }
  const onHotspot = useCallback(async (key: HotspotKey) => {
    if (!(await ensureSelf())) return;
    if (key === "wc") {
      const next = selfAction === "wc" ? null : "wc";
      setLiveGuidedState({ action: next });
      setSelfAction(next);
      return;
    }
    const zone = key === "banc" ? "balcon" : "comptoir";
    const next = selfAction === "assis" && selfZone === zone ? null : "assis";
    setLiveGuidedState({ zone: next ? zone : undefined, action: next });
    if (next) setSelfZone(zone);
    setSelfAction(next);
  }, [ensureSelf, selfAction, selfZone]);

  const total = totalVisitors || (visitors?.length ?? 0);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-terra-deep">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-terra opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-terra" />
            </span>
            En direct
          </p>
          <h1 className="font-display text-2xl font-semibold">🎮 KréaGame</h1>
          <p className="text-xs text-ink-soft">Achète en jouant, dans la vraie boutique.</p>
        </div>
        <p className="shrink-0 rounded-full border border-ink/10 bg-white px-3 py-1.5 text-sm font-semibold shadow-soft">
          {visitors === null ? "…" : `${total} visiteur${total > 1 ? "s" : ""}`}
        </p>
      </div>

      <LiveShop3D visitors={visitors ?? []} printing={printing} selfId={selfId} selfZone={selfZone} selfAction={selfAction} onHotspot={onHotspot} />

      {/* Barre d'actions du parcours guidé. */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {step === "spectate" && (
          <button type="button" onClick={enterShop} className="rounded-full bg-terra px-6 py-3 text-sm font-bold text-ink shadow-soft transition-transform active:scale-95">
            🚶 Entrer dans la boutique
          </button>
        )}
        {step !== "spectate" && (
          <>
            <button type="button" onClick={() => { guide("rayons", null); setStep("shop"); setSheet({ kind: "categories" }); }} className="rounded-full border-2 border-ink/15 bg-white px-4 py-2.5 text-xs font-bold shadow-soft">
              🛍️ {step === "checkout" ? "Retourner en rayon" : "Changer de rayon"}
            </button>
            <button type="button" onClick={goCheckout} className="rounded-full bg-terra px-4 py-2.5 text-xs font-bold text-ink shadow-soft">
              💳 Aller en caisse{cartCount > 0 ? ` (${cartCount})` : ""}
            </button>
            {step === "checkout" && (
              <button type="button" onClick={openCart} className="rounded-full border-2 border-ink/15 bg-white px-4 py-2.5 text-xs font-bold shadow-soft">
                🛒 Voir mon panier
              </button>
            )}
            <button type="button" onClick={leaveShop} className="rounded-full border-2 border-ink/15 bg-white px-4 py-2.5 text-xs font-bold text-ink-soft shadow-soft">
              🚪 Sortir
            </button>
          </>
        )}
        {selfAction && (
          <button type="button" onClick={() => { setLiveGuidedState({ action: null }); setSelfAction(null); }} className="rounded-full border-2 border-ink/15 bg-white px-4 py-2.5 text-xs font-bold shadow-soft">
            🧍 Se lever
          </button>
        )}
        {selfId && step === "spectate" && (
          <button type="button" onClick={() => setSheet({ kind: "avatar" })} className="rounded-full border-2 border-ink/15 bg-white px-4 py-2.5 text-xs font-bold text-ink-soft shadow-soft">
            🎨 Mon avatar
          </button>
        )}
      </div>
      {hint && <p className="mt-3 rounded-2xl border border-terra/40 bg-terra/10 px-4 py-2 text-center text-xs font-semibold text-terra-deep">{hint}</p>}
      {step === "spectate" && !hint && (
        <p className="mt-3 text-center text-[11px] text-ink-faint">Astuce : touche le canapé, le banc ou la cabine 🚽 pour t’y installer.</p>
      )}
      <p className="mt-3 text-center text-[11px] text-ink-faint">
        100 % anonyme : des avatars péi, aucune donnée personnelle. Actualisé toutes les 4 secondes. Pincez pour zoomer, glissez pour tourner.
      </p>

      {/* Bottom sheets. */}
      {sheet && (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
          <button type="button" aria-label="Fermer" onClick={() => setSheet(null)} className="absolute inset-0 bg-ink/30" />
          <div className="absolute inset-x-0 bottom-0 max-h-[70svh] overflow-y-auto rounded-t-3xl bg-linen p-5 shadow-[0_-8px_30px_rgb(23_23_23/0.18)]">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink/15" />
            {sheet.kind === "avatar" && (
              <>
                <h2 className="mb-1 font-display text-lg font-semibold">Choisis ton personnage</h2>
                <p className="mb-4 text-xs text-ink-soft">Il te représentera dans la boutique — ton nom d’animal péi reste généré automatiquement.</p>
                <div className="grid grid-cols-4 gap-3">
                  {LIVE_AVATARS.map((_, index) => (
                    <button key={index} type="button" onClick={() => chooseAvatar(index)} className={`flex items-center justify-center rounded-2xl border-2 bg-white py-3 shadow-soft transition-transform active:scale-95 ${liveAvatarChoice() === index ? "border-terra" : "border-ink/10"}`}>
                      <AvatarPreview index={index} />
                    </button>
                  ))}
                </div>
              </>
            )}
            {sheet.kind === "categories" && (
              <>
                <h2 className="mb-1 font-display text-lg font-semibold">Tu cherches quoi ?</h2>
                <p className="mb-4 text-xs text-ink-soft">Choisis un rayon, on t’y emmène.</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(category => (
                    <button key={category.value} type="button" onClick={() => chooseCategory(category.value, category.label)} className="rounded-full border-2 border-ink/15 bg-white px-4 py-2.5 text-xs font-bold shadow-soft transition-transform active:scale-95">
                      {category.label}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setSheet(null)} className="mt-4 w-full rounded-full border-2 border-ink/15 bg-white px-4 py-2.5 text-xs font-bold text-ink-soft">
                  Je me balade seulement
                </button>
              </>
            )}
            {sheet.kind === "suggestions" && (
              <>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-semibold">{sheet.label}</h2>
                  <button type="button" onClick={() => setSheet({ kind: "categories" })} className="rounded-full border-2 border-ink/15 bg-white px-3 py-1.5 text-[11px] font-bold text-ink-soft">
                    ← Rayons
                  </button>
                </div>
                {suggestions === null && <p className="py-6 text-center text-sm text-ink-soft">On regarde ce qu’il y a en rayon…</p>}
                {suggestions?.length === 0 && <p className="py-6 text-center text-sm text-ink-soft">Rien dans ce rayon pour l’instant — jette un œil aux autres !</p>}
                <ul className="space-y-2">
                  {suggestions?.map(product => (
                    <li key={product.id} className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white p-2.5 shadow-soft">
                      {product.image && <img src={product.image} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{product.name}</p>
                        <p className="text-xs text-ink-soft">{formatPrice(product.priceCents)}</p>
                      </div>
                      {product.simple ? (
                        <button type="button" onClick={() => quickAdd(product)} disabled={added.has(product.id)} className={`shrink-0 rounded-full px-3.5 py-2 text-[11px] font-bold shadow-soft transition-transform active:scale-95 ${added.has(product.id) ? "bg-ink/10 text-ink-soft" : "bg-terra text-ink"}`}>
                          {added.has(product.id) ? "✓ Ajouté" : "+ Panier"}
                        </button>
                      ) : (
                        <Link href={`/boutique/${product.slug}`} className="shrink-0 rounded-full border-2 border-ink/15 bg-white px-3.5 py-2 text-[11px] font-bold">
                          Configurer
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
                {cartCount > 0 && (
                  <button type="button" onClick={goCheckout} className="mt-4 w-full rounded-full bg-terra px-4 py-3 text-sm font-bold text-ink shadow-soft">
                    💳 Aller en caisse ({cartCount})
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
