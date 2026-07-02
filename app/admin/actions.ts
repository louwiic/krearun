"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createAdminSession,
  destroyAdminSession,
  isAdmin,
  verifyAdminCredentials,
} from "@/lib/auth";
import {
  createProduct,
  deleteProduct,
  getProductById,
  saveSettings,
  updateOrderStatus,
  updateProduct,
  uploadProductPhotos,
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

  if (!(await verifyAdminCredentials(email, password))) {
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

// Convertit les photos en WebP (max 1600 px, qualité 82) avant envoi
// vers PocketBase. Les SVG restent tels quels (déjà légers, vectoriels).
async function toWebp(files: File[]): Promise<File[]> {
  const sharp = (await import("sharp")).default;
  const out: File[] = [];
  for (const file of files) {
    if (file.type === "image/svg+xml") {
      out.push(file);
      continue;
    }
    try {
      const buffer = await sharp(Buffer.from(await file.arrayBuffer()))
        .rotate() // respecte l'orientation EXIF
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
      out.push(new File([new Uint8Array(buffer)], name, { type: "image/webp" }));
    } catch {
      out.push(file); // format non géré par sharp → on envoie l'original
    }
  }
  return out;
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
  const newFiles = formData
    .getAll("nouvelles_images")
    .filter((f): f is File => f instanceof File && f.size > 0);

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
    images: existingImages,
    colors: parseColors(String(formData.get("colors") ?? "")),
    stock: Math.max(0, parseInt(String(formData.get("stock") ?? "0"), 10) || 0),
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on",
    isNew: formData.get("isNew") === "on",
  };

  const product = id ? await updateProduct(id, data) : await createProduct(data);

  // Les nouvelles photos sont compressées en WebP puis stockées dans PocketBase
  if (product && newFiles.length > 0) {
    const urls = await uploadProductPhotos(product.id, await toWebp(newFiles));
    await updateProduct(product.id, { images: [...existingImages, ...urls] });
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
