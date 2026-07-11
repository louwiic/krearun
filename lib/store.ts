// Couche de persistance branchée sur PocketBase (collections : products,
// orders, newsletter, settings — règles null, accès superuser uniquement).
// Tout le site passe par ces fonctions, exécutées côté serveur seulement.
import crypto from "node:crypto";
import type {
  CheckoutCustomer,
  Customer,
  InventoryColor,
  Order,
  OrderStatus,
  Product,
  Review,
  Settings,
} from "./types";
import { uploadProductImageToR2, uploadProductMediaToR2 } from "./r2";
import { DEFAULT_REUNION_SHIPPING_RATES } from "./shipping";
import { DEFAULT_PICKUP_POINTS } from "./pickup";

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
  return value.replace(/'/g, "\\'");
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
  namePersonalizationEnabled: boolean;
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
    namePersonalizationEnabled: Boolean(r.namePersonalizationEnabled),
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

export async function decrementStock(items: { productId: string; quantity: number }[]) {
  for (const item of items) {
    const product = await getProductById(item.productId);
    if (!product) continue;
    if (product.preorder) continue;
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
    approved: Boolean(r.approved),
    createdAt: toIso(r.created),
    updatedAt: toIso(r.updated),
  };
}

export async function getApprovedReviews(productId?: string): Promise<Review[]> {
  const filters = ["approved=true"];
  if (productId) filters.push(`productId='${escapeFilter(productId)}'`);
  try {
    const res = await pb<ListResult<PbReview>>(
      `/collections/reviews/records?perPage=100&sort=-created&filter=${encodeURIComponent(
        filters.join(" && ")
      )}`
    );
    return res.items.map(mapReview);
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

interface PbOrder {
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
    totalCents: r.totalCents ?? 0,
    status: r.status ?? "pending",
    stripeSessionId: r.stripeSessionId || null,
    trackingNumber: r.trackingNumber ?? "",
    note: r.note ?? "",
    items: r.items ?? [],
    createdAt: toIso(r.created),
    updatedAt: toIso(r.updated),
  };
}

export async function getOrders(): Promise<Order[]> {
  const res = await pb<ListResult<PbOrder>>(
    `/collections/orders/records?perPage=500&sort=-created`
  );
  return res.items.map(mapOrder);
}

export async function getOrderById(id: string): Promise<Order | null> {
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
  input: Omit<Order, "id" | "number" | "createdAt" | "updatedAt">
): Promise<Order> {
  const last = await pb<ListResult<PbOrder>>(
    `/collections/orders/records?perPage=1&sort=-number`
  );
  const number = (last.items[0]?.number ?? 1000) + 1;
  const record = await pb<PbOrder>(`/collections/orders/records`, {
    method: "POST",
    body: { ...input, number, stripeSessionId: input.stripeSessionId ?? "" },
  });
  return mapOrder(record);
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  extra?: { trackingNumber?: string }
): Promise<Order | null> {
  try {
    const record = await pb<PbOrder>(`/collections/orders/records/${id}`, {
      method: "PATCH",
      body: { status, ...extra },
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

export async function getSubscribers(): Promise<{ email: string; createdAt: string }[]> {
  const res = await pb<ListResult<{ email: string; created: string }>>(
    `/collections/newsletter/records?perPage=500&sort=created`
  );
  return res.items.map((r) => ({ email: r.email, createdAt: toIso(r.created) }));
}

export async function addSubscriber(email: string): Promise<boolean> {
  try {
    await pb(`/collections/newsletter/records`, {
      method: "POST",
      body: { email: email.toLowerCase() },
    });
    return true;
  } catch {
    return false; // doublon (index unique) ou erreur réseau
  }
}

// ─── Réglages ───────────────────────────────────────────────

const DEFAULT_SETTINGS: Settings = {
  announcement: "",
  shipping_flat_cents: 590,
  free_shipping_threshold_cents: 0,
  shipping_rates_json: JSON.stringify(DEFAULT_REUNION_SHIPPING_RATES),
  pickup_points_json: JSON.stringify(DEFAULT_PICKUP_POINTS, null, 2),
  store_name: "Krearun Studio",
  contact_email: "stdcreativ974@gmail.com",
  instagram: "",
  hero_image_url: "/home/hero-monster-product.webp",
  hero_image_alt: "Porte-canette Monster avec mousqueton offert au bord d'une piscine",
  hero_link_url: "/boutique",
  hero_secondary_media_url: "/home/hero-secondary-video.mp4",
  hero_secondary_media_type: "video",
  hero_secondary_media_alt: "Vidéo courte du produit Monster",
  hero_secondary_link_url: "/boutique",
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
