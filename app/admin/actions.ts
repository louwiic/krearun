"use server";

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAdminSession,
  destroyAdminSession,
  isAdmin,
} from "@/lib/auth";
import {
  createProduct,
  deleteProduct,
  getProductById,
  saveSettings,
  updateOrderStatus,
  updateProduct,
} from "@/lib/store";
import { slugify } from "@/lib/format";
import type { Category, OrderStatus, ProductColor } from "@/lib/types";

// ─── Auth ───────────────────────────────────────────────────

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return { error: "Identifiants incorrects." };
  }

  await createAdminSession();
  redirect(String(formData.get("suivant") || "/admin"));
}

export async function logoutAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

// ─── Produits ───────────────────────────────────────────────

function parseColors(raw: string): ProductColor[] {
  // Format : "Crème:#f3ead9, Sauge:#b8c8a8"
  return raw
    .split(",")
    .map((part) => {
      const [name, hex] = part.split(":").map((s) => s.trim());
      return name && hex ? { name, hex } : null;
    })
    .filter((c): c is ProductColor => c !== null);
}

async function saveUploadedImages(formData: FormData): Promise<string[]> {
  const files = formData
    .getAll("nouvelles_images")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const urls: string[] = [];
  if (files.length === 0) return urls;

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  for (const file of files) {
    const ext = path.extname(file.name).toLowerCase() || ".jpg";
    if (![".jpg", ".jpeg", ".png", ".webp", ".svg", ".avif"].includes(ext)) continue;
    const filename = `${randomUUID()}${ext}`;
    await fs.writeFile(
      path.join(uploadDir, filename),
      Buffer.from(await file.arrayBuffer())
    );
    urls.push(`/uploads/${filename}`);
  }
  return urls;
}

export async function saveProductAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/admin/produits");

  const existingImages = String(formData.get("images") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const uploaded = await saveUploadedImages(formData);

  const compareAtRaw = String(formData.get("compareAt") ?? "").replace(",", ".");
  const priceRaw = String(formData.get("price") ?? "0").replace(",", ".");

  const data = {
    name,
    slug: slugify(String(formData.get("slug") ?? "") || name),
    tagline: String(formData.get("tagline") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    priceCents: Math.round(parseFloat(priceRaw || "0") * 100),
    compareAtCents: compareAtRaw
      ? Math.round(parseFloat(compareAtRaw) * 100)
      : null,
    category: String(formData.get("category") ?? "deco") as Category,
    images: [...existingImages, ...uploaded],
    colors: parseColors(String(formData.get("colors") ?? "")),
    stock: Math.max(0, parseInt(String(formData.get("stock") ?? "0"), 10) || 0),
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on",
    isNew: formData.get("isNew") === "on",
  };

  if (id) {
    await updateProduct(id, data);
  } else {
    await createProduct(data);
  }

  revalidatePath("/", "layout");
  redirect("/admin/produits");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id && (await getProductById(id))) {
    await deleteProduct(id);
  }
  revalidatePath("/", "layout");
  redirect("/admin/produits");
}

// ─── Commandes ──────────────────────────────────────────────

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  await updateOrderStatus(id, status);
  revalidatePath("/admin/commandes");
  redirect(`/admin/commandes/${id}`);
}

// ─── Réglages ───────────────────────────────────────────────

export async function saveSettingsAction(formData: FormData) {
  await requireAdmin();

  const flat = String(formData.get("shipping_flat") ?? "0").replace(",", ".");
  const threshold = String(formData.get("free_shipping_threshold") ?? "0").replace(",", ".");

  await saveSettings({
    store_name: String(formData.get("store_name") ?? "").trim(),
    announcement: String(formData.get("announcement") ?? "").trim(),
    contact_email: String(formData.get("contact_email") ?? "").trim(),
    instagram: String(formData.get("instagram") ?? "").trim(),
    shipping_flat_cents: Math.round(parseFloat(flat || "0") * 100),
    free_shipping_threshold_cents: Math.round(parseFloat(threshold || "0") * 100),
  });

  revalidatePath("/", "layout");
  redirect("/admin/parametres");
}
