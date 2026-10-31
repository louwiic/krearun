export const JOURNEY_CLIENT_KINDS = ["visit", "product_view", "add_to_cart", "cart_updated", "view_cart", "begin_checkout", "checkout_error"] as const;
export const JOURNEY_PAGES = {home:"Accueil",shop:"Boutique",product:"Fiche produit",personalize:"Personnaliser",workshop:"L’atelier",contact:"Contact",cart:"Panier",confirmation:"Retour de paiement",other:"Autre page"} as const;
export function journeyPage(path: string): keyof typeof JOURNEY_PAGES {
  if(path === "/") return "home";
  if(path === "/boutique") return "shop";
  if(path.startsWith("/boutique/")) return "product";
  if(path === "/panier") return "cart";
  if(path.startsWith("/commande/")) return "confirmation";
  if(/personnaliser|porte-boisson-personnalise|lettre-personnalisee|clicker/.test(path)) return "personalize";
  if(path === "/atelier") return "workshop";
  if(path === "/contact") return "contact";
  return "other";
}
export type JourneyKind = typeof JOURNEY_CLIENT_KINDS[number] | "payment_started";
export type JourneyItem = { productId: string; quantity: number; variantId?: string; name?: string; unitPriceCents?: number };
export type JourneyEvent = { id?: string; eventId: string; sessionId: string; kind: JourneyKind; productId?: string; items: JourneyItem[]; created?: string; checkoutId?: string; page?: keyof typeof JOURNEY_PAGES };
export const JOURNEY_RETENTION_DAYS = 30;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function parseJourneyEvent(value: unknown): JourneyEvent | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (v.consent !== true || !UUID.test(String(v.sessionId)) || !UUID.test(String(v.eventId)) || !JOURNEY_CLIENT_KINDS.includes(v.kind as typeof JOURNEY_CLIENT_KINDS[number])) return null;
  if (v.page !== undefined && (typeof v.page !== "string" || !Object.hasOwn(JOURNEY_PAGES,v.page))) return null;
  if (!Array.isArray(v.items) || v.items.length > 30) return null;
  const validId = (id: unknown) => typeof id === "string" && /^([a-z0-9]{15}|clicker-studio)$/.test(id);
  if (v.productId !== undefined && !validId(v.productId)) return null;
  const items: JourneyItem[] = [];
  for (const entry of v.items) {
    if (!entry || typeof entry !== "object") return null;
    const item = entry as Record<string, unknown>;
    if (!validId(item.productId) || !Number.isInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 100) return null;
    if (item.variantId !== undefined && (typeof item.variantId !== "string" || item.variantId.length > 80)) return null;
    items.push({ productId: String(item.productId), quantity: Number(item.quantity), ...(item.variantId ? { variantId: String(item.variantId) } : {}) });
  }
  return { eventId: String(v.eventId), sessionId: String(v.sessionId), kind: v.kind as JourneyKind, ...(v.page ? {page:v.page as keyof typeof JOURNEY_PAGES} : {}), ...(v.productId ? { productId: String(v.productId) } : {}), items };
}
export const JOURNEY_LABELS: Record<JourneyKind, string> = { visit: "Visite", product_view: "Produit consulté", add_to_cart: "Ajout au panier", cart_updated: "Panier modifié", view_cart: "Panier consulté", begin_checkout: "Demande de paiement", payment_started: "Paiement Stripe ouvert", checkout_error: "Échec de préparation du paiement" };
export function purchaseJourneys(events: JourneyEvent[], paidCheckoutIds: Set<string>, now = Date.now()) {
  const grouped = new Map<string, JourneyEvent[]>();
  for (const event of events) { const group = grouped.get(event.sessionId) ?? []; group.push(event); grouped.set(event.sessionId, group); }
  return [...grouped.entries()].map(([sessionId, rows]) => {
    rows.sort((a,b) => Date.parse(a.created ?? "") - Date.parse(b.created ?? ""));
    const latest = rows.at(-1)!;
    const snapshot = [...rows].reverse().find(e => e.kind !== "product_view" && e.kind !== "checkout_error");
    const items = snapshot?.items ?? [];
    const paid = rows.some(e => !!e.checkoutId && paidCheckoutIds.has(e.checkoutId));
    const reachedCart = rows.some(e => ["view_cart", "begin_checkout", "payment_started"].includes(e.kind));
    const hasCart = items.length > 0;
    const idle = now - Date.parse(latest.created ?? "") >= 30 * 60000;
    const status = paid ? "paid" : hasCart && reachedCart && idle ? "abandoned" : hasCart && reachedCart ? "active_cart" : "browsing";
    return { sessionId, rows, items, paid, reachedCart, status, lastAt: latest.created ?? "", firstAt: rows[0].created ?? "", estimatedCents: items.reduce((s,i) => s + (i.unitPriceCents ?? 0) * i.quantity, 0) };
  }).sort((a,b) => Date.parse(b.lastAt) - Date.parse(a.lastAt));
}
