export type Category = "veilleuses" | "vases" | "bureau" | "rangement" | "deco";

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "veilleuses", label: "Veilleuses & Lampes" },
  { value: "vases", label: "Vases" },
  { value: "bureau", label: "Bureau" },
  { value: "rangement", label: "Rangement" },
  { value: "deco", label: "Décoration" },
];

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  priceCents: number;
  compareAtCents?: number | null;
  category: Category;
  images: string[];
  colors: ProductColor[];
  stock: number;
  featured: boolean;
  active: boolean;
  isNew: boolean;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | "pending"
  | "paid"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

export const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "En attente" },
  { value: "paid", label: "Payée" },
  { value: "preparing", label: "En préparation" },
  { value: "shipped", label: "Expédiée" },
  { value: "delivered", label: "Livrée" },
  { value: "cancelled", label: "Annulée" },
];

export interface OrderItem {
  productId: string;
  name: string;
  priceCents: number;
  quantity: number;
  color: string;
  image: string;
}

export interface Order {
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
  stripeSessionId?: string | null;
  note: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  announcement: string;
  shipping_flat_cents: number;
  free_shipping_threshold_cents: number;
  store_name: string;
  contact_email: string;
  instagram: string;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  quantity: number;
  color: string;
  image: string;
  stock: number;
}
