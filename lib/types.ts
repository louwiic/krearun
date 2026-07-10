export type Category =
  | "veilleuses"
  | "vases"
  | "bureau"
  | "rangement"
  | "salle-de-bain"
  | "deco";

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "veilleuses", label: "Veilleuses & Lampes" },
  { value: "vases", label: "Vases" },
  { value: "bureau", label: "Bureau" },
  { value: "rangement", label: "Rangement" },
  { value: "salle-de-bain", label: "Salle de bain" },
  { value: "deco", label: "Décoration" },
];

export interface ProductColor {
  name: string;
  hex: string;
}

export interface InventoryColor extends ProductColor {
  id: string;
  stockGrams: number;
  active: boolean;
  note: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
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
  videoUrl: string;
  weightGrams: number;
  colors: ProductColor[];
  stock: number;
  featured: boolean;
  active: boolean;
  isNew: boolean;
  preorder: boolean;
  namePersonalizationEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  authorName: string;
  email: string;
  rating: number;
  message: string;
  approved: boolean;
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
  customName?: string;
  image: string;
  weightGrams?: number;
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
  trackingNumber: string;
  note: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  announcement: string;
  shipping_flat_cents: number;
  free_shipping_threshold_cents: number;
  shipping_rates_json: string;
  pickup_points_json: string;
  store_name: string;
  contact_email: string;
  instagram: string;
  hero_image_url: string;
  hero_image_alt: string;
  hero_link_url: string;
  hero_secondary_media_url: string;
  hero_secondary_media_type: "image" | "video";
  hero_secondary_media_alt: string;
  hero_secondary_link_url: string;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  quantity: number;
  color: string;
  customName?: string;
  image: string;
  stock: number;
  weightGrams: number;
  preorder?: boolean;
}

export interface CheckoutCustomer {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: string;
}

export type FulfillmentMethod = "delivery" | "pickup";
