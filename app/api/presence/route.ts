import { createHash } from "node:crypto";
import { countOrdersInProduction, getProductBySlug } from "@/lib/store";
import { siteOrigin } from "@/lib/seo";
import { LIVE_ACTIONS, LIVE_AVATARS, LIVE_ZONES, type LiveAction } from "@/lib/live-avatars";

// Présence temps réel : état en mémoire (une seule instance serveur), rien
// n'est persisté — un visiteur disparaît de lui-même après 60 s sans ping.
// zone/action/avatar sont déclarés par le client pendant le parcours guidé
// de /boutique-live, validés contre des listes fermées.
type Visitor = { path: string; firstSeen: number; lastSeen: number; zone?: string; action?: LiveAction; avatar?: number };
type ProductCard = { name: string; image: string; slug: string } | null;

const globalState = globalThis as unknown as {
  __livePresence?: Map<string, Visitor>;
  __livePresenceProducts?: Map<string, { card: ProductCard; until: number }>;
  __livePresenceOrders?: { count: number; until: number };
};
const visitors = (globalState.__livePresence ??= new Map());
const productCache = (globalState.__livePresenceProducts ??= new Map());

// Commandes en production affichées dans l'atelier : cache 60 s pour que le
// polling (toutes les 4 s par spectateur) ne sollicite PocketBase qu'une fois.
async function printingCount(): Promise<number> {
  const cached = globalState.__livePresenceOrders;
  if (cached && cached.until > Date.now()) return cached.count;
  try {
    const count = await countOrdersInProduction();
    globalState.__livePresenceOrders = { count, until: Date.now() + 60_000 };
    return count;
  } catch { return cached?.count ?? 0; }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ACTIVE_MS = 60_000;

const AVATARS = [
  { name: "Paille-en-queue", emoji: "🕊️" },
  { name: "Caméléon", emoji: "🦎" },
  { name: "Tangue", emoji: "🦔" },
  { name: "Dodo", emoji: "🦤" },
  { name: "Gecko vert", emoji: "🐸" },
  { name: "Papangue", emoji: "🦅" },
  { name: "Baleine", emoji: "🐋" },
  { name: "Tortue", emoji: "🐢" },
  { name: "Cardinal", emoji: "🐦" },
  { name: "Zourite", emoji: "🐙" },
  { name: "Margouillat", emoji: "🦎" },
  { name: "Bichique", emoji: "🐟" },
];

function prune(now: number) {
  for (const [id, visitor] of visitors) if (now - visitor.lastSeen > ACTIVE_MS * 5) visitors.delete(id);
}

function zoneFor(path: string): { zone: string; productSlug?: string } {
  const [pathname, query = ""] = path.split("?");
  if (pathname === "/") return { zone: "entree" };
  if (pathname === "/boutique") return { zone: "rayons" };
  const product = pathname.match(/^\/boutique\/([^/]+)$/);
  if (product) return { zone: "rayons", productSlug: decodeURIComponent(product[1]) };
  if (["/personnaliser", "/clicker-studio", "/lettre-personnalisee"].includes(pathname)) return { zone: "atelier" };
  if (["/panier", "/commande"].some(p => pathname.startsWith(p))) return { zone: "caisse" };
  if (pathname === "/boutique-live") return { zone: "balcon" };
  if (["/contact", "/faq", "/a-propos", "/avis", "/tutoriels", "/suivi", "/compte"].some(p => pathname.startsWith(p))) return { zone: "comptoir" };
  void query;
  return { zone: "allee" };
}

async function productCard(slug: string): Promise<ProductCard> {
  const cached = productCache.get(slug);
  if (cached && cached.until > Date.now()) return cached.card;
  let card: ProductCard = null;
  try {
    const product = await getProductBySlug(slug);
    if (product?.active) card = { name: product.name, image: product.images[0] ?? "", slug: product.slug };
  } catch { return cached?.card ?? null; }
  productCache.set(slug, { card, until: Date.now() + 10 * 60_000 });
  if (productCache.size > 300) for (const key of [...productCache.keys()].slice(0, 100)) productCache.delete(key);
  return card;
}

function allowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  return !origin || [new URL(request.url).origin, siteOrigin()].includes(origin);
}

export async function POST(request: Request) {
  const result = (status: number) => new Response(null, { status, headers: { "Cache-Control": "private, no-store" } });
  if (!allowedOrigin(request)) return result(403);
  if (/bot|crawler|spider|headless|preview/i.test(request.headers.get("user-agent") || "")) return result(204);
  let body: unknown;
  try {
    if (Number(request.headers.get("content-length")) > 1024) return result(413);
    body = await request.json();
  } catch { return result(400); }
  if (typeof body !== "object" || body === null) return result(400);
  const { sessionId, path, zone, action, avatar } = body as { sessionId?: unknown; path?: unknown; zone?: unknown; action?: unknown; avatar?: unknown };
  if (typeof sessionId !== "string" || !UUID.test(sessionId)) return result(400);
  if (typeof path !== "string" || !path.startsWith("/") || path.length > 160) return result(400);
  const now = Date.now();
  prune(now);
  if (visitors.size > 500 && !visitors.has(sessionId)) return result(429);
  const existing = visitors.get(sessionId);
  visitors.set(sessionId, {
    path,
    firstSeen: existing?.firstSeen ?? now,
    lastSeen: now,
    // La zone virtuelle n'a de sens que sur la page live elle-même.
    zone: path.startsWith("/boutique-live") && typeof zone === "string" && (LIVE_ZONES as readonly string[]).includes(zone) ? zone : undefined,
    action: path.startsWith("/boutique-live") && typeof action === "string" && (LIVE_ACTIONS as readonly string[]).includes(action) ? action as LiveAction : undefined,
    avatar: typeof avatar === "number" && Number.isInteger(avatar) && avatar >= 0 && avatar < LIVE_AVATARS.length ? avatar : existing?.avatar,
  });
  return result(202);
}

export async function GET(request: Request) {
  if (!allowedOrigin(request)) return new Response(null, { status: 403 });
  const now = Date.now();
  prune(now);
  const active = [...visitors.entries()].filter(([, visitor]) => now - visitor.lastSeen <= ACTIVE_MS);
  // La scène affiche 50 personnages max (les plus anciens dans la boutique) ;
  // les suivants « font la queue » côté client, mais le total reste exact.
  const displayed = active.sort(([, a], [, b]) => a.firstSeen - b.firstSeen).slice(0, 50);
  const payload = await Promise.all(displayed.map(async ([sessionId, visitor]) => {
    // Identité publique dérivée par hachage : jamais le sessionId brut.
    const digest = createHash("sha256").update(`live:${sessionId}`).digest();
    const avatar = AVATARS[digest[0] % AVATARS.length];
    const { zone, productSlug } = zoneFor(visitor.path);
    return {
      id: digest.toString("hex").slice(0, 10),
      seed: digest[1] * 256 + digest[2],
      name: avatar.name,
      emoji: avatar.emoji,
      zone: visitor.zone ?? zone,
      action: visitor.action ?? null,
      avatar: visitor.avatar ?? digest[3] % LIVE_AVATARS.length,
      product: productSlug ? await productCard(productSlug) : null,
      sinceSeconds: Math.round((now - visitor.firstSeen) / 1000),
    };
  }));
  return Response.json({ visitors: payload, total: active.length, workshop: { printing: await printingCount() } }, { headers: { "Cache-Control": "private, no-store" } });
}
