"use client";
import { hasAudienceConsent } from "./privacy";
import { UUID, type JourneyItem, type JourneyKind, JOURNEY_PAGES } from "./purchase-journey";
const KEY = "krearun:purchase-session:v1";
let sending = Promise.resolve();
let memory: { id: string; at: number } | null = null;
export function clearJourneyTracking() { memory = null; try { sessionStorage.removeItem(KEY); } catch {} }
export function journeySessionId(): string | undefined {
  if (typeof window === "undefined" || !hasAudienceConsent()) return undefined;
  try {
    if (!memory) {
      const saved = JSON.parse(sessionStorage.getItem(KEY) || "null");
      if (saved && typeof saved === "object" && UUID.test(saved.id) && typeof saved.at === "number" && saved.at <= Date.now()) memory = saved;
    }
  } catch {}
  if (!memory || Date.now() - memory.at > 30 * 60000) memory = { id: crypto.randomUUID(), at: Date.now() };
  memory.at = Date.now();
  try { sessionStorage.setItem(KEY, JSON.stringify(memory)); } catch {}
  return memory.id;
}
export function trackJourney(kind: JourneyKind, items: JourneyItem[] = [], productId?: string, page?: keyof typeof JOURNEY_PAGES) {
  const sessionId = journeySessionId();
  if (!sessionId || document.visibilityState !== "visible") return;
  const eventId = crypto.randomUUID();
  // Exclude names, custom text, email, addresses and full URLs from browser payloads.
  const body = JSON.stringify({ sessionId, eventId, kind, consent: true, productId, page, items: items.slice(0,30).map(i => ({ productId: i.productId, quantity: i.quantity, ...(i.variantId ? { variantId: i.variantId } : {}) })) });
  sending = sending.then(async () => { for (let attempt = 0; attempt < 2; attempt++) { if (!hasAudienceConsent()) return; try { const r = await fetch("/api/purchase-events", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true, signal: AbortSignal.timeout(5000) }); if (r.ok || r.status < 500) return; } catch {} } }).catch(() => {});
}
