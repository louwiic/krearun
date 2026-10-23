import { DEFAULT_METROPOLITAN_SHIPPING } from "./metropolitan-shipping";
// Couche de persistance branchée sur PocketBase (collections : products,
// orders, newsletter, settings — règles null, accès superuser uniquement).
// Tout le site passe par ces fonctions, exécutées côté serveur seulement.
import crypto from "node:crypto";
import type { HolderRequest, HolderDecision } from "./custom-holder";
import type { ShipmentSummary } from "./colissimo";
import type { ColissimoDocuments } from "./colissimo-response";
import type { LetterEvent } from "./letter-events";
import type {
  CheckoutCustomer,
  Customer,
  CreateOrderInput,
  InventoryColor,
  Order,
  OrderStatus,
  OrderManagementFields,
  Product,
  Review,
  NewsletterContact,
  Settings,
} from "./types";
import { uploadProductImageToR2, uploadProductMediaToR2 } from "./r2";
import { DEFAULT_REUNION_SHIPPING_RATES } from "./shipping";
import { DEFAULT_PICKUP_POINTS } from "./pickup";
import { DEFAULT_STORE_CATEGORIES } from "./categories";
import { normalizeQuantityDiscounts } from "./quantity-discounts";
import { isPaymentStatus, publicHttpUrl } from "./order-management";

const PB_URL = (process.env.POCKETBASE_URL ?? "").replace(/\/$/, "");
const PB_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL ?? "";
const PB_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD ?? "";

// ─── Client HTTP avec cache de token ────────────────────────

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;

  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: PB_EMAIL, password: PB_PASSWORD }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`PocketBase : échec d'authentification (${res.status})`);
  }
  const data = await res.json();
  // Le token superuser vit bien plus longtemps ; on le renouvelle toutes les 6 h.
  cachedToken = { value: data.token, expiresAt: Date.now() + 6 * 60 * 60 * 1000 };
  return data.token;
}

async function pb<T = unknown>(
  path: string,
  init?: { method?: string; body?: unknown }
): Promise<T> {
  const doFetch = async (token: string) =>
    fetch(`${PB_URL}/api${path}`, {
      method: init?.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });

  let res = await doFetch(await getToken());
  if (res.status === 401) {
    cachedToken = null; // token expiré → on se ré-authentifie une fois
    res = await doFetch(await getToken());
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`PocketBase ${init?.method ?? "GET"} ${path} → ${res.status} ${detail}`);
  }
  return res.status === 204 ? (null as T) : ((await res.json()) as T);
}

function escapeFilter(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

// Custom holder assets stay protected in PocketBase, never on public R2.
type PbHolderRequest = HolderRequest & { expand?: { holder_decisions_via_requestId?: HolderDecision | HolderDecision[] } };
const HOLDER_EXPAND = "expand=holder_decisions_via_requestId";
function mapHolderRequest(record: PbHolderRequest): HolderRequest {
  const { expand, ...request } = record;
  const decision = expand?.holder_decisions_via_requestId;
  return { ...request, decision: Array.isArray(decision) ? decision[0] : decision };
}
export async function getHolderRequest(id: string): Promise<HolderRequest | null> {
  if (!/^[a-z0-9]{15}$/.test(id)) return null;
  const list = await pb<ListResult<PbHolderRequest>>(`/collections/holder_requests/records?perPage=1&${HOLDER_EXPAND}&filter=${encodeURIComponent(`id='${id}'`)}`);
  return list.items[0] ? mapHolderRequest(list.items[0]) : null;
}
export async function getHolderRequests(customerId?: string): Promise<HolderRequest[]> {
  if (customerId && !/^[a-z0-9]{15}$/.test(customerId)) return [];
  const requests: HolderRequest[]=[];
  for (let page=1;;page++) {
    const list=await pb<ListResult<PbHolderRequest>>(`/collections/holder_requests/records?perPage=100&page=${page}&sort=-created&${HOLDER_EXPAND}${customerId?`&filter=${encodeURIComponent(`customerId='${customerId}'`)}`:''}`);
    requests.push(...list.items.map(mapHolderRequest));
    if (page>=list.totalPages) break;
  }
  return requests;
}
export async function createHolderRequest(input: Pick<HolderRequest, "customerId" | "customerEmail" | "customerName" | "quantity" | "note" | "configuration" | "palette" | "submissionKey">, logo: Buffer, original: Buffer, sourceSvg?: Buffer): Promise<HolderRequest> {
  const filter=encodeURIComponent(`submissionKey='${escapeFilter(input.submissionKey)}'`);
  const existing=await pb<ListResult<PbHolderRequest>>(`/collections/holder_requests/records?perPage=1&${HOLDER_EXPAND}&filter=${filter}`);
  if (existing.items[0]) return mapHolderRequest(existing.items[0]);
  const form=new FormData();
  for (const [key,value] of Object.entries(input)) form.set(key,typeof value==='object'?JSON.stringify(value):String(value));
  form.set("logo",new Blob([new Uint8Array(logo)],{type:"image/png"}),"logo-4-couleurs.png");
  form.set("originalLogo",new Blob([new Uint8Array(original)],{type:"image/png"}),"logo-original.png");
  if(sourceSvg)form.set("sourceSvg",new Blob([new Uint8Array(sourceSvg)],{type:"image/svg+xml"}),"logo-vectoriel.svg");
  const send=async()=>fetch(`${PB_URL}/api/collections/holder_requests/records`,{method:"POST",headers:{Authorization:await getToken()},body:form,cache:"no-store"});
  let response=await send();
  if(response.status===401){cachedToken=null;response=await send();}
  if(!response.ok) {
    const duplicate=await pb<ListResult<PbHolderRequest>>(`/collections/holder_requests/records?perPage=1&${HOLDER_EXPAND}&filter=${filter}`);
    if(duplicate.items[0])return mapHolderRequest(duplicate.items[0]);
    throw new Error("Impossible d'enregistrer la demande.");
  }
  return mapHolderRequest(await response.json() as PbHolderRequest);
}
export async function createHolderDecision(requestId: string, input: Omit<HolderDecision,"id"|"requestId"|"created">) {
  if(!/^[a-z0-9]{15}$/.test(requestId))throw new Error("Demande invalide.");
  // Unique requestId index makes the first decision final, including concurrent reviews.
  return pb<HolderDecision>("/collections/holder_decisions/records",{method:"POST",body:{requestId,...input}});
}
export async function saveHolderCheckout(id: string, stripeSessionId: string) {
  if(!/^[a-z0-9]{15}$/.test(id))throw new Error("Demande invalide.");
  await pb(`/collections/holder_requests/records/${id}`,{method:"PATCH",body:{stripeSessionId}});
}
export async function markHolderPaid(id: string, orderId: string) {
  if(!/^[a-z0-9]{15}$/.test(id) || !/^[a-z0-9]{15}$/.test(orderId))throw new Error("Demande invalide.");
  await pb(`/collections/holder_requests/records/${id}`,{method:"PATCH",body:{orderId}});
}
export async function getHolderLogo(request: HolderRequest, original=false, sourceSvg=false): Promise<Buffer> {
  const {token}=await pb<{token:string}>("/files/token",{method:"POST"});
  const filename=sourceSvg?request.sourceSvg:original?request.originalLogo:request.logo;
  if(!filename)throw new Error("Logo indisponible.");
  const response=await fetch(`${PB_URL}/api/files/holder_requests/${request.id}/${encodeURIComponent(filename)}?token=${encodeURIComponent(token)}`,{cache:"no-store"});
  if(!response.ok)throw new Error("Logo indisponible.");
  return Buffer.from(await response.arrayBuffer());
}
export async function registerCustomizationCustomer(email: string, name: string) {
  const recent=await pb<ListResult<PbCustomerActivation>>(`/collections/customer_activation_tokens/records?perPage=1&sort=-created&filter=${encodeURIComponent(`email='${escapeFilter(normalizeEmail(email))}'`)}`);
  if(recent.items[0]&&Date.parse(recent.items[0].expiresAt)>Date.now()+7*86400000-60000)throw new Error("Un lien vient d’être envoyé. Patientez une minute avant de réessayer.");
  const existing=await pb<ListResult<PbCustomer>>(`/collections/customers/records?perPage=1&filter=${encodeURIComponent(`email='${escapeFilter(normalizeEmail(email))}'`)}`);
  if(existing.items.length)return;
  const password=randomPassword();
  try {
    await pb("/collections/customers/records",{method:"POST",body:{email:normalizeEmail(email),name,password,passwordConfirm:password,verified:false,country:"RE"}});
  } catch(error) {
    const duplicate=await pb<ListResult<PbCustomer>>(`/collections/customers/records?perPage=1&filter=${encodeURIComponent(`email='${escapeFilter(normalizeEmail(email))}'`)}`);
    if(!duplicate.items.length)throw error;
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toIso(pbDate: string): string {
  return pbDate ? new Date(pbDate).toISOString() : new Date(0).toISOString();
}

interface ListResult<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
}

export async function recordLetterEvent(event: LetterEvent) {
  const path = `/collections/letter_events/records?perPage=1&filter=${encodeURIComponent(`eventId='${event.eventId}'`)}`;
  const existing = await pb<ListResult<{ id: string }>>(path);
  if (existing.items.length) return;
  try {
    await pb("/collections/letter_events/records", { method: "POST", body: event });
  } catch (error) {
    // A unique index also protects concurrent requests carrying the same event ID.
    if ((await pb<ListResult<{ id: string }>>(path)).items.length) return;
    throw error;
  }
}

export type LetterStats = {
  visitors: number; clicks: number; clickVisitors: number; interactions: number;
  downloads: number; downloadVisitors: number; stl: number; threeMf: number;
};

export async function getLetterStats(): Promise<LetterStats | null> {
  try {
    const result = await pb<ListResult<LetterStats>>("/collections/letter_stats/records?perPage=1");
    return result.items[0] ?? null;
  } catch {
    console.error("[Letter stats] Dashboard statistics unavailable");
    return null;
  }
}

// ─── Produits ───────────────────────────────────────────────

interface PbProduct {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  priceCents: number;
  compareAtCents: number;
  category: Product["category"];
  images: string[] | null;
  videoUrl: string;
  weightGrams: number;
  colors: Product["colors"] | null;
  stock: number;
  featured: boolean;
  active: boolean;
  isNew: boolean;
  preorder: boolean;
  partnerShared: boolean;
  privateSale?: boolean;
  namePersonalizationEnabled: boolean;
  namePersonalizationPriceCents: number;
  variants: Product["variants"] | null;
  quantityDiscounts: Product["quantityDiscounts"] | null;
  created: string;
  updated: string;
}

function mapProduct(r: PbProduct): Product {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    tagline: r.tagline ?? "",
    description: r.description ?? "",
    priceCents: r.priceCents ?? 0,
    compareAtCents: r.compareAtCents > 0 ? r.compareAtCents : null,
    category: r.category,
    images: r.images ?? [],
    videoUrl: r.videoUrl ?? "",
    weightGrams: r.weightGrams ?? 0,
    colors: r.colors ?? [],
    stock: r.stock ?? 0,
    featured: Boolean(r.featured),
    active: Boolean(r.active),
    isNew: Boolean(r.isNew),
    preorder: Boolean(r.preorder),
    partnerShared: Boolean(r.partnerShared),
    privateSale: Boolean(r.privateSale),
    namePersonalizationEnabled: Boolean(r.namePersonalizationEnabled),
    namePersonalizationPriceCents: Math.max(0, r.namePersonalizationPriceCents ?? 0),
    variants: Array.isArray(r.variants) ? r.variants : [],
    quantityDiscounts: normalizeQuantityDiscounts(r.quantityDiscounts),
    createdAt: toIso(r.created),
    updatedAt: toIso(r.updated),
  };
}

function productPayload(p: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>) {
  const { compareAtCents, ...rest } = p;
  return compareAtCents !== undefined
    ? { ...rest, compareAtCents: compareAtCents ?? 0 }
    : rest;
}

export async function getProducts(opts?: {
  includeInactive?: boolean;
  partnerSharedOnly?: boolean;
}): Promise<Product[]> {
  const conditions = [
    ...(opts?.includeInactive ? [] : ["active=true"]),
    ...(opts?.partnerSharedOnly ? ["partnerShared=true"] : []),
    ...(!opts?.includeInactive || opts?.partnerSharedOnly ? ["privateSale=false"] : []),
  ];
  const filter = conditions.length
    ? `&filter=${encodeURIComponent(conditions.join(" && "))}`
    : "";
  const res = await pb<ListResult<PbProduct>>(
    `/collections/products/records?perPage=500&sort=-created${filter}`
  );
  return res.items.map(mapProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const res = await pb<ListResult<PbProduct>>(
    `/collections/products/records?perPage=1&filter=${encodeURIComponent(
      `slug='${escapeFilter(slug)}'`
    )}`
  );
  return res.items[0] ? mapProduct(res.items[0]) : null;
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    return mapProduct(await pb<PbProduct>(`/collections/products/records/${id}`));
  } catch {
    return null;
  }
}

export async function createProduct(
  input: Omit<Product, "id" | "createdAt" | "updatedAt">
): Promise<Product> {
  const record = await pb<PbProduct>(`/collections/products/records`, {
    method: "POST",
    body: productPayload(input),
  });
  return mapProduct(record);
}

export async function updateProduct(
  id: string,
  patch: Partial<Omit<Product, "id" | "createdAt">>
): Promise<Product | null> {
  try {
    const record = await pb<PbProduct>(`/collections/products/records/${id}`, {
      method: "PATCH",
      body: productPayload(patch),
    });
    return mapProduct(record);
  } catch {
    return null;
  }
}

export async function deleteProduct(id: string): Promise<void> {
  await pb(`/collections/products/records/${id}`, { method: "DELETE" });
}

// Téléverse les photos produit dans Cloudflare R2 et renvoie leurs URLs publiques.
export async function uploadProductPhotos(
  productId: string,
  files: File[]
): Promise<string[]> {
  if (files.length === 0) return [];
  return Promise.all(files.map((file) => uploadProductImageToR2(productId, file)));
}

export async function uploadProductVideo(productId: string, file: File): Promise<string> {
  return uploadProductMediaToR2(productId, file);
}

export async function decrementStock(items: { productId: string; quantity: number; variantId?: string }[]) {
  for (const item of items) {
    const product = await getProductById(item.productId);
    if (!product) continue;
    if (product.preorder) continue;
    const variant = product.variants.find((candidate) => candidate.id === item.variantId);
    if (variant) {
      const variants = product.variants.map((candidate) =>
        candidate.id === variant.id
          ? { ...candidate, stock: Math.max(0, candidate.stock - item.quantity) }
          : candidate
      );
      await updateProduct(item.productId, {
        variants,
        stock: variants.filter((candidate) => candidate.active).reduce((sum, candidate) => sum + candidate.stock, 0),
      });
      continue;
    }
    await pb(`/collections/products/records/${item.productId}`, {
      method: "PATCH",
      body: { stock: Math.max(0, product.stock - item.quantity) },
    });
  }
}

// ─── Avis clients ───────────────────────────────────────────

interface PbReview {
  id: string;
  productId: string;
  productName: string;
  authorName: string;
  email: string;
  rating: number;
  message: string;
  imageUrl?: string;
  approved: boolean;
  created: string;
  updated: string;
}

function mapReview(r: PbReview): Review {
  return {
    id: r.id,
    productId: r.productId ?? "",
    productName: r.productName ?? "",
    authorName: r.authorName ?? "",
    email: r.email ?? "",
    rating: r.rating ?? 5,
    message: r.message ?? "",
    imageUrl: r.imageUrl ?? "",
    approved: Boolean(r.approved),
    createdAt: toIso(r.created),
    updatedAt: toIso(r.updated),
  };
}

export async function getApprovedReviews(productId?: string): Promise<Review[]> {
  const filters = ["approved=true"];
  if (productId) filters.push(`productId='${escapeFilter(productId)}'`);
  try {
    const reviews: Review[] = [];
    for (let page = 1; ; page++) {
      const res = await pb<ListResult<PbReview>>(
        `/collections/reviews/records?perPage=100&page=${page}&sort=-created,id&filter=${encodeURIComponent(filters.join(" && "))}`,
      );
      reviews.push(...res.items.map(mapReview));
      if (page >= res.totalPages) break;
    }
    return reviews;
  } catch {
    return [];
  }
}

export async function getReviews(): Promise<Review[]> {
  try {
    const res = await pb<ListResult<PbReview>>(
      `/collections/reviews/records?perPage=500&sort=-created`
    );
    return res.items.map(mapReview);
  } catch {
    return [];
  }
}

export async function createReview(input: {
  productId: string;
  productName: string;
  authorName: string;
  email: string;
  rating: number;
  message: string;
  imageUrl: string;
}): Promise<Review> {
  const record = await pb<PbReview>(`/collections/reviews/records`, {
    method: "POST",
    body: {
      ...input,
      email: normalizeEmail(input.email),
      approved: false,
    },
  });
  return mapReview(record);
}

export async function updateReviewApproval(
  id: string,
  approved: boolean
): Promise<Review | null> {
  try {
    const record = await pb<PbReview>(`/collections/reviews/records/${id}`, {
      method: "PATCH",
      body: { approved },
    });
    return mapReview(record);
  } catch {
    return null;
  }
}

export async function deleteReview(id: string): Promise<void> {
  await pb(`/collections/reviews/records/${id}`, { method: "DELETE" });
}

// ─── Inventaire matière ────────────────────────────────────

interface PbInventoryColor {
  id: string;
  name: string;
  hex: string;
  stockGrams: number;
  active: boolean;
  note: string;
  sortOrder: number;
  created: string;
  updated: string;
}

function mapInventoryColor(r: PbInventoryColor): InventoryColor {
  return {
    id: r.id,
    name: r.name ?? "",
    hex: r.hex ?? "#000000",
    stockGrams: r.stockGrams ?? 0,
    active: Boolean(r.active),
    note: r.note ?? "",
    sortOrder: r.sortOrder ?? 0,
    createdAt: toIso(r.created),
    updatedAt: toIso(r.updated),
  };
}

export async function getInventoryColors(opts?: {
  includeInactive?: boolean;
}): Promise<InventoryColor[]> {
  const filter = opts?.includeInactive ? "" : `&filter=${encodeURIComponent("active=true")}`;
  const res = await pb<ListResult<PbInventoryColor>>(
    `/collections/inventory_colors/records?perPage=500&sort=sortOrder,name${filter}`
  );
  return res.items.map(mapInventoryColor);
}

export async function getInventoryColorById(id: string): Promise<InventoryColor | null> {
  try {
    return mapInventoryColor(await pb<PbInventoryColor>(`/collections/inventory_colors/records/${id}`));
  } catch {
    return null;
  }
}

export async function createInventoryColor(
  input: Omit<InventoryColor, "id" | "createdAt" | "updatedAt">
): Promise<InventoryColor> {
  const record = await pb<PbInventoryColor>(`/collections/inventory_colors/records`, {
    method: "POST",
    body: input,
  });
  return mapInventoryColor(record);
}

export async function updateInventoryColor(
  id: string,
  patch: Partial<Omit<InventoryColor, "id" | "createdAt" | "updatedAt">>
): Promise<InventoryColor | null> {
  try {
    const record = await pb<PbInventoryColor>(`/collections/inventory_colors/records/${id}`, {
      method: "PATCH",
      body: patch,
    });
    return mapInventoryColor(record);
  } catch {
    return null;
  }
}

// ─── Commandes ──────────────────────────────────────────────

export type ColissimoShipment = Omit<ShipmentSummary, "documents"> & {
  orderId: string; documents: ColissimoDocuments; rawResponse?: string; contentType?: string;
};
export async function getColissimoShipment(orderId: string): Promise<ColissimoShipment | null> {
  if (!/^[a-z0-9]{15}$/.test(orderId)) throw new Error("Commande invalide.");
  const result = await pb<ListResult<ColissimoShipment>>(`/collections/colissimo_shipments/records?perPage=1&filter=${encodeURIComponent(`orderId='${orderId}'`)}`);
  return result.items[0] || null;
}
export async function reserveColissimoShipment(orderId: string, productCode: string) {
  // Database unique index prevents concurrent purchases across processes/instances.
  return pb<ColissimoShipment>("/collections/colissimo_shipments/records", {
    method: "POST", body: { orderId, productCode, state: "generating", documents: {} },
  });
}
export async function saveColissimoShipment(id: string, patch: Partial<ColissimoShipment>) {
  if (!/^[a-z0-9]{15}$/.test(id)) throw new Error("Expédition invalide.");
  return pb<ColissimoShipment>(`/collections/colissimo_shipments/records/${id}`, { method: "PATCH", body: patch });
}
export async function releaseRejectedColissimoShipment(id: string) {
  if (!/^[a-z0-9]{15}$/.test(id)) throw new Error("Expédition invalide.");
  await pb(`/collections/colissimo_shipments/records/${id}`, { method: "DELETE" });
}

interface PbOrder extends Partial<OrderManagementFields> {
  id: string;
  number: number;
  email: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;
  subtotalCents: number;
  shippingCents: number;
  shippingQuote?: Order["shippingQuote"];
  totalCents: number;
  status: OrderStatus;
  stripeSessionId: string;
  trackingNumber: string;
  note: string;
  items: Order["items"] | null;
  created: string;
  updated: string;
}

function mapOrder(r: PbOrder): Order {
  const paymentStatus = r.paymentStatus && isPaymentStatus(r.paymentStatus)
    ? r.paymentStatus : ["paid", "preparing", "ready", "shipped", "delivered"].includes(r.status) ? "paid" : "unpaid";
  return {
    id: r.id,
    number: r.number,
    email: r.email ?? "",
    name: r.name ?? "",
    phone: r.phone ?? "",
    addressLine1: r.addressLine1 ?? "",
    addressLine2: r.addressLine2 ?? "",
    city: r.city ?? "",
    postalCode: r.postalCode ?? "",
    country: r.country ?? "FR",
    subtotalCents: r.subtotalCents ?? 0,
    shippingCents: r.shippingCents ?? 0,
    shippingQuote: r.shippingQuote,
    totalCents: r.totalCents ?? 0,
    status: r.status ?? "pending",
    stripeSessionId: r.stripeSessionId || null,
    trackingNumber: r.trackingNumber ?? "",
    note: r.note ?? "",
    items: r.items ?? [],
    source: r.source || "web",
    sourceId: r.sourceId || "",
    paymentStatus,
    amountPaidCents: paymentStatus === "paid" ? r.totalCents : paymentStatus === "deposit" ? r.amountPaidCents ?? 0 : 0,
    description: r.description || "",
    quantityText: r.quantityText || "",
    internalNote: r.internalNote || "",
    tags: Array.isArray(r.tags) ? r.tags : [],
    customerProfileUrl: publicHttpUrl(r.customerProfileUrl),
    productUrl: publicHttpUrl(r.productUrl),
    productImage: r.productImage || "",
    orderedAt: r.orderedAt ? toIso(r.orderedAt) : toIso(r.created),
    dueDate: r.dueDate ? toIso(r.dueDate) : "",
    urgent: r.urgent || false,
    createdAt: toIso(r.created),
    updatedAt: toIso(r.updated),
  };
}

export async function getOrders(): Promise<Order[]> {
  const orders: Order[] = [];
  for (let page = 1; ; page++) {
    const res = await pb<ListResult<PbOrder>>(`/collections/orders/records?perPage=500&page=${page}&sort=-created,id`);
    orders.push(...res.items.map(mapOrder));
    if (page >= res.totalPages) break;
  }
  return orders.sort((a, b) => b.orderedAt.localeCompare(a.orderedAt) || b.number - a.number);
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (!/^[a-z0-9]{15}$/.test(id)) return null;
  try {
    return mapOrder(await pb<PbOrder>(`/collections/orders/records/${id}`));
  } catch {
    return null;
  }
}

export async function getOrderByStripeSession(sessionId: string): Promise<Order | null> {
  const res = await pb<ListResult<PbOrder>>(
    `/collections/orders/records?perPage=1&filter=${encodeURIComponent(
      `stripeSessionId='${escapeFilter(sessionId)}'`
    )}`
  );
  return res.items[0] ? mapOrder(res.items[0]) : null;
}

export async function createOrder(
  input: CreateOrderInput & { legacyData?: Record<string, unknown> }
): Promise<Order> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const last = await pb<ListResult<PbOrder>>("/collections/orders/records?perPage=1&sort=-number");
    const number = (last.items[0]?.number ?? 1000) + 1;
    const paymentStatus = input.paymentStatus ?? (input.status === "pending" || input.status === "cancelled" ? "unpaid" : "paid");
    try {
      return mapOrder(await pb<PbOrder>("/collections/orders/records", {
        method: "POST", body: {
          ...input, number, stripeSessionId: input.stripeSessionId ?? "", source: input.source || "web",
          paymentStatus, amountPaidCents: paymentStatus === "paid" ? input.totalCents : input.amountPaidCents ?? 0,
          orderedAt: input.orderedAt || new Date().toISOString(),
        },
      }));
    } catch (error) {
      // A concurrent checkout/import may have reserved this order number.
      if (attempt === 4 || !(error instanceof Error) || !/"number":\{[^}]*"code":"validation_not_unique"/.test(error.message)) throw error;
    }
  }
  throw new Error("Impossible de réserver un numéro de commande.");
}

export async function getOrderBySourceId(source: string, sourceId: string): Promise<Order | null> {
  const res = await pb<ListResult<PbOrder>>(`/collections/orders/records?perPage=1&filter=${encodeURIComponent(`source='${escapeFilter(source)}' && sourceId='${escapeFilter(sourceId)}'`)}`);
  return res.items[0] ? mapOrder(res.items[0]) : null;
}

export async function updateManagedOrder(id: string, input: Partial<CreateOrderInput>): Promise<Order> {
  if (!/^[a-z0-9]{15}$/.test(id)) throw new Error("Identifiant invalide.");
  return mapOrder(await pb<PbOrder>(`/collections/orders/records/${id}`, { method: "PATCH", body: input }));
}

export async function ensureOrderManagementSchema(): Promise<void> {
  const schema = await pb<{ fields: { name: string; values?: string[] }[] }>("/collections/orders");
  if (!["sourceId", "paymentStatus", "amountPaidCents", "legacyData", "orderedAt"].every(name => schema.fields.some(field => field.name === name))
    || !schema.fields.find(field => field.name === "status")?.values?.includes("ready")) {
    throw new Error("La migration du schéma des commandes doit être appliquée avant l'enregistrement.");
  }
  if (!schema.fields.some(field => field.name === "productImage")) await pb("/collections/orders", { method: "PATCH", body: { fields: [...schema.fields, { name: "productImage", type: "text", max: 2000 }] } });
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  extra?: { trackingNumber?: string }
): Promise<Order | null> {
  try {
    const previous = await getOrderById(id);
    if (!previous) return null;
    const record = await pb<PbOrder>(`/collections/orders/records/${id}`, {
      method: "PATCH",
      body: { status, paymentStatus: previous.paymentStatus, amountPaidCents: previous.amountPaidCents, ...extra },
    });
    return mapOrder(record);
  } catch {
    return null;
  }
}

export async function getOrderByNumberAndEmail(
  number: number,
  email: string
): Promise<Order | null> {
  if (!Number.isSafeInteger(number) || number <= 0 || !email.trim()) return null;
  const res = await pb<ListResult<PbOrder>>(
    `/collections/orders/records?perPage=1&filter=${encodeURIComponent(
      `number=${number} && email='${escapeFilter(email.toLowerCase())}'`
    )}`
  );
  return res.items[0] ? mapOrder(res.items[0]) : null;
}

// ─── Comptes clients ────────────────────────────────────────

interface PbCustomer {
  id: string;
  email: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;
  created: string;
  updated: string;
}

function mapCustomer(r: PbCustomer): Customer {
  return {
    id: r.id,
    email: r.email,
    name: r.name ?? "",
    phone: r.phone ?? "",
    addressLine1: r.addressLine1 ?? "",
    addressLine2: r.addressLine2 ?? "",
    city: r.city ?? "",
    postalCode: r.postalCode ?? "",
    country: r.country ?? "",
    createdAt: toIso(r.created),
    updatedAt: toIso(r.updated),
  };
}

export async function getCustomers(): Promise<Customer[]> {
  const result = await pb<ListResult<PbCustomer>>(
    "/collections/customers/records?perPage=500&sort=-created"
  );
  return result.items.map(mapCustomer);
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  try {
    return mapCustomer(await pb<PbCustomer>(`/collections/customers/records/${id}`));
  } catch {
    return null;
  }
}

export async function getOrdersByCustomerEmail(email: string): Promise<Order[]> {
  const result = await pb<ListResult<PbOrder>>(
    `/collections/orders/records?perPage=500&sort=-created&filter=${encodeURIComponent(
      `email='${escapeFilter(normalizeEmail(email))}'`
    )}`
  );
  return result.items.map(mapOrder);
}

interface PbCustomerActivation {
  id: string;
  email: string;
  tokenHash: string;
  expiresAt: string;
  usedAt: string;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function randomPassword(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export async function ensureCustomerAccount(
  customer: CheckoutCustomer
): Promise<{ email: string; created: boolean }> {
  const email = normalizeEmail(customer.email);
  const name = `${customer.firstName} ${customer.lastName}`.trim();
  const found = await pb<ListResult<PbCustomer>>(
    `/collections/customers/records?perPage=1&filter=${encodeURIComponent(
      `email='${escapeFilter(email)}'`
    )}`
  );
  const existing = found.items[0];
  const payload = {
    email,
    name,
    phone: customer.phone,
    addressLine1: customer.addressLine1,
    addressLine2: customer.addressLine2,
    city: customer.city,
    postalCode: customer.postalCode,
    country: customer.country,
    verified: true,
  };

  if (existing) {
    await pb(`/collections/customers/records/${existing.id}`, {
      method: "PATCH",
      body: payload,
    });
    return { email, created: false };
  }

  const password = randomPassword();
  await pb(`/collections/customers/records`, {
    method: "POST",
    body: {
      ...payload,
      password,
      passwordConfirm: password,
    },
  });
  return { email, created: true };
}

export async function createCustomerActivationToken(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("base64url");
  const normalized = normalizeEmail(email);
  await pb(`/collections/customer_activation_tokens/records`, {
    method: "POST",
    body: {
      email: normalized,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    },
  });
  return token;
}

export async function activateCustomerPassword(
  token: string,
  password: string
): Promise<{ ok: boolean; reason?: string }> {
  if (password.length < 10) {
    return { ok: false, reason: "Le mot de passe doit contenir au moins 10 caractères." };
  }
  const tokenHash = hashToken(token);
  const found = await pb<ListResult<PbCustomerActivation>>(
    `/collections/customer_activation_tokens/records?perPage=1&filter=${encodeURIComponent(
      `tokenHash='${escapeFilter(tokenHash)}' && usedAt=''`
    )}`
  );
  const activation = found.items[0];
  if (!activation) return { ok: false, reason: "Ce lien n'est plus valide." };
  if (new Date(activation.expiresAt).getTime() < Date.now()) {
    return { ok: false, reason: "Ce lien a expiré." };
  }

  const email = normalizeEmail(activation.email);
  const customers = await pb<ListResult<PbCustomer>>(
    `/collections/customers/records?perPage=1&filter=${encodeURIComponent(
      `email='${escapeFilter(email)}'`
    )}`
  );
  const customer = customers.items[0];
  if (!customer) return { ok: false, reason: "Compte client introuvable." };

  await pb(`/collections/customers/records/${customer.id}`, {
    method: "PATCH",
    body: { password, passwordConfirm: password, verified: true },
  });
  await pb(`/collections/customer_activation_tokens/records/${activation.id}`, {
    method: "PATCH",
    body: { usedAt: new Date().toISOString() },
  });
  return { ok: true };
}

// ─── Newsletter ─────────────────────────────────────────────

export async function getNewsletterRecords(): Promise<NewsletterContact[]> {
  const contacts: NewsletterContact[] = [];
  for (let page = 1; ; page++) {
    const res = await pb<ListResult<{ id: string; email: string; created: string; ignored?: boolean; source?: string }>>(
      `/collections/newsletter/records?perPage=500&page=${page}&sort=created,id`
    );
    contacts.push(...res.items.map((r) => ({
      id: r.id, email: normalizeEmail(r.email), createdAt: toIso(r.created), ignored: Boolean(r.ignored), source: r.source ?? "",
    })));
    if (page >= res.totalPages) return contacts;
  }
}

export async function getSubscribers(): Promise<NewsletterContact[]> {
  return (await getNewsletterRecords()).filter((record) => record.source !== "customer");
}

async function newsletterRecordByEmail(email: string) {
  return (await getNewsletterRecords()).find((record) => record.email === normalizeEmail(email)) ?? null;
}

export async function setMailingContactIgnored(email: string, ignored: boolean): Promise<void> {
  const existing = await newsletterRecordByEmail(email);
  if (existing) {
    await pb(`/collections/newsletter/records/${existing.id}`, { method: "PATCH", body: { ignored } });
  } else if (ignored) {
    await pb(`/collections/newsletter/records`, {
      method: "POST", body: { email: normalizeEmail(email), ignored: true, source: "customer" },
    });
  }
}

export async function removeNewsletterContact(email: string, hasOrder: boolean): Promise<void> {
  const existing = await newsletterRecordByEmail(email);
  if (!existing || existing.source === "customer") return;
  if (hasOrder) {
    await pb(`/collections/newsletter/records/${existing.id}`, {
      method: "PATCH", body: { source: "customer", ignored: true },
    });
  } else {
    await pb(`/collections/newsletter/records/${existing.id}`, { method: "DELETE" });
  }
}

let newsletterConsentSchema: Promise<void> | undefined;
async function ensureNewsletterConsentSchema() {
  newsletterConsentSchema ??= (async () => {
    const schema = await pb<{fields: {name: string; [key: string]: unknown}[]}>("/collections/newsletter");
    const fields = [...schema.fields];
    for (const name of ["consentVersion", "consentAt"]) if (!fields.some(field=>field.name===name)) fields.push({name,type:"text"});
    if (fields.length !== schema.fields.length) await pb("/collections/newsletter", {method:"PATCH",body:{fields}});
  })().catch(error=>{newsletterConsentSchema=undefined;throw error;});
  return newsletterConsentSchema;
}
export async function addSubscriber(email: string, consent?: {version: string; at: string}): Promise<boolean> {
  if (consent) await ensureNewsletterConsentSchema();
  const proof = consent ? {consentVersion:consent.version,consentAt:consent.at} : {};
  const existing = await newsletterRecordByEmail(email);
  if (existing) {
    await pb(`/collections/newsletter/records/${existing.id}`, {method:"PATCH",body:{source:"newsletter",ignored:false,...proof}});
    return existing.source === "customer" || existing.ignored;
  }
  await pb("/collections/newsletter/records", {method:"POST",body:{email:normalizeEmail(email),source:"newsletter",...proof}});
  return true;
}

// ─── Réglages ───────────────────────────────────────────────

const DEFAULT_SETTINGS: Settings = {
  announcement: "",
  categories_json: JSON.stringify(DEFAULT_STORE_CATEGORIES),
  homepage_mode: "single_product",
  homepage_featured_product_slug: "porte-canette-monster",
  shipping_flat_cents: 590,
  free_shipping_threshold_cents: 0,
  shipping_rates_json: JSON.stringify(DEFAULT_REUNION_SHIPPING_RATES),
  metropolitan_shipping_rates_json: JSON.stringify(DEFAULT_METROPOLITAN_SHIPPING),
  pickup_points_json: JSON.stringify(DEFAULT_PICKUP_POINTS, null, 2),
  store_name: "Krearun Studio",
  contact_email: "stdcreativ974@gmail.com",
  instagram: "",
  hero_image_url: "/api/r2/site/home/1788581406949-238774c7-142d-4a92-8c51-d277017e4fc8-porte-canette-monster-turquoise.webp",
  hero_image_alt: "Porte-canette Monster noir et turquoise devant un lac de montagne",
  hero_link_url: "/boutique/porte-canette-monster",
  hero_secondary_media_url: "/api/r2/site/home/videos/1788627589225-42489653-145b-491c-8c04-273263bb79ea-demo-monster.mp4",
  hero_secondary_media_type: "video",
  hero_secondary_media_alt: "Vidéo de démonstration du porte-canette Monster",
  hero_secondary_link_url: "/boutique/porte-canette-monster",
  newsletter_popup_enabled: true,
  newsletter_popup_discount_pct: 10,
  newsletter_popup_delay_seconds: 4,
  newsletter_popup_promo_code: "BIENVENUE10",
  newsletter_popup_title: "Une remise pour votre première commande",
  newsletter_popup_text:
    "Recevez nos nouveautés, offres et sélections Krearun directement par email.",
};

type PbSettings = Partial<Settings> & { id: string };

async function getSettingsRecord(): Promise<PbSettings | null> {
  const res = await pb<ListResult<PbSettings>>(`/collections/settings/records?perPage=1`);
  return res.items[0] ?? null;
}

export async function getSettings(): Promise<Settings> {
  try {
    const record = await getSettingsRecord();
    return { ...DEFAULT_SETTINGS, ...(record ?? {}) };
  } catch {
    // PocketBase injoignable : le site reste debout avec les valeurs par défaut
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const record = await getSettingsRecord();
  const saved = record
    ? await pb<PbSettings>(`/collections/settings/records/${record.id}`, {
        method: "PATCH",
        body: patch,
      })
    : await pb<PbSettings>(`/collections/settings/records`, {
        method: "POST",
        body: { ...DEFAULT_SETTINGS, ...patch },
      });
  return { ...DEFAULT_SETTINGS, ...saved };
}

// Private, durable register of withdrawal declarations. No anonymous PocketBase access.
let withdrawalSchema: Promise<void> | undefined;
async function ensureWithdrawalSchema(): Promise<void> {
  withdrawalSchema ??= (async () => {
    try { await pb("/collections/withdrawal_requests"); }
    catch (error) {
      if (!(error instanceof Error) || !error.message.includes("→ 404")) throw error;
      try {
        await pb("/collections", { method: "POST", body: {
          name: "withdrawal_requests", type: "base", listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null,
          fields: [
            { name: "submissionKey", type: "text", required: true, max: 36 },
            { name: "name", type: "text", required: true, max: 120 },
            { name: "email", type: "email", required: true },
            { name: "contract", type: "text", required: true, max: 2000 },
            { name: "address", type: "text", max: 500 },
            { name: "receivedAt", type: "text", required: true },
            { name: "receiptSent", type: "bool" }, { name: "notificationSent", type: "bool" },
          ], indexes: ["CREATE UNIQUE INDEX idx_withdrawal_submission ON withdrawal_requests (submissionKey)"],
        } });
      } catch (creationError) {
        // Another request may have created the same collection in the meantime.
        try { await pb("/collections/withdrawal_requests"); } catch { throw creationError; }
      }
    }
  })().catch(error => { withdrawalSchema = undefined; throw error; });
  return withdrawalSchema;
}
export async function createWithdrawal(input: import("./withdrawal").WithdrawalDeclaration): Promise<import("./withdrawal").WithdrawalRecord> {
  await ensureWithdrawalSchema();
  const find = () => pb<ListResult<import("./withdrawal").WithdrawalRecord>>(`/collections/withdrawal_requests/records?perPage=1&filter=${encodeURIComponent(`submissionKey='${escapeFilter(input.submissionKey)}'`)}`);
  const existing = (await find()).items[0];
  if (existing) {
    if (existing.email !== input.email || existing.name !== input.name || existing.contract !== input.contract || existing.address !== input.address) throw new Error("Submission key conflict");
    return existing;
  }
  try { return await pb("/collections/withdrawal_requests/records", { method: "POST", body: { ...input, receivedAt: new Date().toISOString(), receiptSent: false, notificationSent: false } }); }
  catch (error) { const saved = (await find()).items[0]; if (saved && saved.email === input.email && saved.name === input.name && saved.contract === input.contract && saved.address === input.address) return saved; throw error; }
}
export async function markWithdrawalMail(id: string, field: "receiptSent" | "notificationSent") {
  if (!/^[a-z0-9]{15}$/.test(id)) throw new Error("Invalid receipt reference");
  return pb(`/collections/withdrawal_requests/records/${id}`, { method: "PATCH", body: { [field]: true } });
}
export async function getWithdrawals(): Promise<import("./withdrawal").WithdrawalRecord[]> {
  await ensureWithdrawalSchema();
  const all: import("./withdrawal").WithdrawalRecord[] = [];
  for (let page = 1; ; page++) {
    const result = await pb<ListResult<import("./withdrawal").WithdrawalRecord>>(`/collections/withdrawal_requests/records?perPage=100&page=${page}&sort=-receivedAt`);
    all.push(...result.items); if (page >= result.totalPages) return all;
  }
}
