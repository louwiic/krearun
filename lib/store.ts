// Couche de persistance sur fichiers JSON (data/*.json).
// Le jour où une vraie BDD est choisie, seul ce fichier est à réécrire :
// le reste du site (front + admin) ne dépend que de ces fonctions.
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Order, OrderStatus, Product, Settings } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, value: unknown) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const target = path.join(DATA_DIR, file);
  const tmp = `${target}.${randomUUID()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf-8");
  await fs.rename(tmp, target);
}

// ─── Produits ───────────────────────────────────────────────

export async function getProducts(opts?: {
  includeInactive?: boolean;
}): Promise<Product[]> {
  const products = await readJson<Product[]>("products.json", []);
  return opts?.includeInactive ? products : products.filter((p) => p.active);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getProducts({ includeInactive: true });
  return products.find((p) => p.slug === slug) ?? null;
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await getProducts({ includeInactive: true });
  return products.find((p) => p.id === id) ?? null;
}

export async function createProduct(
  input: Omit<Product, "id" | "createdAt" | "updatedAt">
): Promise<Product> {
  const products = await getProducts({ includeInactive: true });
  const now = new Date().toISOString();
  const product: Product = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
  products.push(product);
  await writeJson("products.json", products);
  return product;
}

export async function updateProduct(
  id: string,
  patch: Partial<Omit<Product, "id" | "createdAt">>
): Promise<Product | null> {
  const products = await getProducts({ includeInactive: true });
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  products[idx] = { ...products[idx], ...patch, updatedAt: new Date().toISOString() };
  await writeJson("products.json", products);
  return products[idx];
}

export async function deleteProduct(id: string): Promise<void> {
  const products = await getProducts({ includeInactive: true });
  await writeJson(
    "products.json",
    products.filter((p) => p.id !== id)
  );
}

export async function decrementStock(items: { productId: string; quantity: number }[]) {
  const products = await getProducts({ includeInactive: true });
  for (const item of items) {
    const p = products.find((x) => x.id === item.productId);
    if (p) p.stock = Math.max(0, p.stock - item.quantity);
  }
  await writeJson("products.json", products);
}

// ─── Commandes ──────────────────────────────────────────────

export async function getOrders(): Promise<Order[]> {
  const orders = await readJson<Order[]>("orders.json", []);
  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOrderById(id: string): Promise<Order | null> {
  const orders = await getOrders();
  return orders.find((o) => o.id === id) ?? null;
}

export async function getOrderByStripeSession(sessionId: string): Promise<Order | null> {
  const orders = await getOrders();
  return orders.find((o) => o.stripeSessionId === sessionId) ?? null;
}

export async function createOrder(
  input: Omit<Order, "id" | "number" | "createdAt" | "updatedAt">
): Promise<Order> {
  const orders = await readJson<Order[]>("orders.json", []);
  const now = new Date().toISOString();
  const number = orders.reduce((max, o) => Math.max(max, o.number), 1000) + 1;
  const order: Order = { ...input, id: randomUUID(), number, createdAt: now, updatedAt: now };
  orders.push(order);
  await writeJson("orders.json", orders);
  return order;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<Order | null> {
  const orders = await readJson<Order[]>("orders.json", []);
  const order = orders.find((o) => o.id === id);
  if (!order) return null;
  order.status = status;
  order.updatedAt = new Date().toISOString();
  await writeJson("orders.json", orders);
  return order;
}

// ─── Newsletter ─────────────────────────────────────────────

export async function getSubscribers(): Promise<{ email: string; createdAt: string }[]> {
  return readJson("newsletter.json", []);
}

export async function addSubscriber(email: string): Promise<boolean> {
  const subs = await getSubscribers();
  if (subs.some((s) => s.email.toLowerCase() === email.toLowerCase())) return false;
  subs.push({ email, createdAt: new Date().toISOString() });
  await writeJson("newsletter.json", subs);
  return true;
}

// ─── Réglages ───────────────────────────────────────────────

const DEFAULT_SETTINGS: Settings = {
  announcement: "",
  shipping_flat_cents: 590,
  free_shipping_threshold_cents: 6000,
  store_name: "Cocon Studio",
  contact_email: "bonjour@cocon.studio",
  instagram: "",
};

export async function getSettings(): Promise<Settings> {
  const saved = await readJson<Partial<Settings>>("settings.json", {});
  return { ...DEFAULT_SETTINGS, ...saved };
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const settings = { ...(await getSettings()), ...patch };
  await writeJson("settings.json", settings);
  return settings;
}
