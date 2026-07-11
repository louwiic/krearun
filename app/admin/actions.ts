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
  deleteReview,
  createInventoryColor,
  deleteProduct,
  getInventoryColors,
  getOrderById,
  getProductById,
  updateReviewApproval,
  saveSettings,
  updateInventoryColor,
  updateOrderStatus,
  updateProduct,
  uploadProductPhotos,
  uploadProductVideo,
} from "@/lib/store";
import {
  sendAdminOrderStatus,
  sendOrderDelivered,
  sendOrderShipped,
} from "@/lib/email";
import { slugify } from "@/lib/format";
import { uploadSiteImageToR2, uploadSiteMediaToR2 } from "@/lib/r2";
import { DEFAULT_PICKUP_POINTS } from "@/lib/pickup";
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

function slugPart(value: string): string {
  return slugify(value || "point-retrait").slice(0, 80);
}

// Convertit les photos en WebP (max 1600 px, qualité 82) avant envoi
// vers R2. Les SVG restent tels quels (déjà légers, vectoriels).
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

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    // Dynamic import keeps Turbopack from tracing Node internals across the app.
    import("node:child_process").then(({ spawn }) => {
    const child = spawn("ffmpeg", args, { stdio: "ignore" });
    child.on("error", reject);
    child.on("close", (code) => {
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}`));
    });
    }, reject);
  });
}

async function toWebMp4(file: File): Promise<File> {
  if (!file.type.startsWith("video/")) return file;
  const [{ mkdtemp, readFile, rm, writeFile }, { tmpdir }, { join }] = await Promise.all([
    import("node:fs/promises"),
    import("node:os"),
    import("node:path"),
  ]);
  const dir = await mkdtemp(join(tmpdir(), "krearun-video-"));
  const input = join(dir, file.name || "input-video");
  const output = join(dir, "video-web.mp4");

  try {
    await writeFile(input, Buffer.from(await file.arrayBuffer()));
    await runFfmpeg([
      "-y",
      "-i",
      input,
      "-vf",
      "scale='min(720,iw)':-2",
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "28",
      "-movflags",
      "+faststart",
      output,
    ]);
    const buffer = await readFile(output);
    const name = file.name.replace(/\.[^.]+$/, "") + ".mp4";
    return new File([new Uint8Array(buffer)], name, { type: "video/mp4" });
  } catch {
    return file;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function saveProductAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/admin/produits");

  const existingImages = String(formData.get("images") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  const newFiles = formData
    .getAll("nouvelles_images")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const videoFile = formData.get("nouvelle_video");
  let videoUrl = String(formData.get("videoUrl") ?? "").trim();

  const compareAtRaw = String(formData.get("compareAt") ?? "").replace(",", ".");
  const priceRaw = String(formData.get("price") ?? "0").replace(",", ".");
  const inventoryColorIds = formData.getAll("inventoryColorIds").map(String);
  const inventoryColors =
    inventoryColorIds.length > 0
      ? (await getInventoryColors({ includeInactive: true }))
          .filter((color) => inventoryColorIds.includes(color.id))
          .map((color) => ({ name: color.name, hex: color.hex }))
      : [];

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
    videoUrl,
    weightGrams: Math.max(0, parseInt(String(formData.get("weightGrams") ?? "0"), 10) || 0),
    colors: [
      ...inventoryColors,
      ...parseColors(String(formData.get("colors") ?? "")),
    ],
    stock: Math.max(0, parseInt(String(formData.get("stock") ?? "0"), 10) || 0),
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on",
    isNew: formData.get("isNew") === "on",
    preorder: formData.get("preorder") === "on",
    namePersonalizationEnabled: formData.get("namePersonalizationEnabled") === "on",
  };

  const product = id ? await updateProduct(id, data) : await createProduct(data);

  // Les nouvelles photos sont compressées en WebP puis stockées dans R2.
  if (product && newFiles.length > 0) {
    const slots = Math.max(0, 3 - existingImages.length);
    const urls = await uploadProductPhotos(product.id, await toWebp(newFiles.slice(0, slots)));
    await updateProduct(product.id, { images: [...existingImages, ...urls].slice(0, 3) });
  }

  if (product && videoFile instanceof File && videoFile.size > 0) {
    videoUrl = await uploadProductVideo(product.id, await toWebMp4(videoFile));
    await updateProduct(product.id, { videoUrl });
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

// ─── Inventaire matière ────────────────────────────────────

export async function saveInventoryColorAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const hex = String(formData.get("hex") ?? "#000000").trim() || "#000000";
  if (!name) redirect("/admin/inventaire");

  const stockGrams = Math.max(0, parseInt(String(formData.get("stockGrams") ?? "0"), 10) || 0);
  const sortOrder = parseInt(String(formData.get("sortOrder") ?? "0"), 10) || 0;
  const data = {
    name,
    hex,
    stockGrams,
    active: formData.get("active") === "on",
    note: String(formData.get("note") ?? "").trim(),
    sortOrder,
  };

  if (id) {
    await updateInventoryColor(id, data);
  } else {
    await createInventoryColor(data);
  }

  revalidatePath("/admin/inventaire");
  revalidatePath("/admin/produits", "layout");
  redirect("/admin/inventaire");
}

export async function toggleInventoryColorAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "on";
  if (id) await updateInventoryColor(id, { active });
  revalidatePath("/admin/inventaire");
  revalidatePath("/admin/produits", "layout");
  redirect("/admin/inventaire");
}

// ─── Commandes ──────────────────────────────────────────────

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();

  const previous = await getOrderById(id);
  const order = await updateOrderStatus(id, status, { trackingNumber });

  // E-mail automatique au client quand le colis part ou arrive
  if (order && previous && previous.status !== status) {
    try {
      if (status === "shipped") await sendOrderShipped(order);
      if (status === "delivered") await sendOrderDelivered(order);
      await sendAdminOrderStatus(order, previous.status);
    } catch (e) {
      console.error("E-mail de statut :", e);
    }
  }

  revalidatePath("/admin/commandes");
  redirect(`/admin/commandes/${id}`);
}

// ─── Avis clients ───────────────────────────────────────────

export async function approveReviewAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await updateReviewApproval(id, true);
  revalidatePath("/", "layout");
  revalidatePath("/admin/avis");
  redirect("/admin/avis");
}

export async function hideReviewAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await updateReviewApproval(id, false);
  revalidatePath("/", "layout");
  revalidatePath("/admin/avis");
  redirect("/admin/avis");
}

export async function deleteReviewAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await deleteReview(id);
  revalidatePath("/", "layout");
  revalidatePath("/admin/avis");
  redirect("/admin/avis");
}

// ─── Réglages ───────────────────────────────────────────────

export async function saveSettingsAction(formData: FormData) {
  await requireAdmin();

  const flat = String(formData.get("shipping_flat") ?? "0").replace(",", ".");
  const threshold = String(formData.get("free_shipping_threshold") ?? "0").replace(",", ".");
  const shippingRatesJson = String(formData.get("shipping_rates_json") ?? "").trim();
  const pickupPoints = DEFAULT_PICKUP_POINTS.map((fallback, index) => {
    const name = String(formData.get(`pickup_name_${index}`) ?? fallback.name).trim();
    return {
      id: String(formData.get(`pickup_id_${index}`) ?? "").trim() || slugPart(name),
      name,
      address: String(formData.get(`pickup_address_${index}`) ?? fallback.address).trim(),
      schedule: String(formData.get(`pickup_schedule_${index}`) ?? fallback.schedule).trim(),
      note: String(formData.get(`pickup_note_${index}`) ?? fallback.note).trim(),
      active: formData.get(`pickup_active_${index}`) === "on",
    };
  }).filter((point) => point.name);
  const heroFile = formData.get("hero_image_file");
  const secondaryFile = formData.get("hero_secondary_media_file");
  let heroImageUrl = String(formData.get("hero_image_url") ?? "").trim();
  let secondaryMediaUrl = String(formData.get("hero_secondary_media_url") ?? "").trim();
  let secondaryMediaType = String(formData.get("hero_secondary_media_type") ?? "image");

  if (heroFile instanceof File && heroFile.size > 0) {
    const [optimized] = await toWebp([heroFile]);
    heroImageUrl = await uploadSiteImageToR2("home", optimized);
  }

  if (secondaryFile instanceof File && secondaryFile.size > 0) {
    if (secondaryFile.type.startsWith("video/")) {
      secondaryMediaUrl = await uploadSiteMediaToR2("home", await toWebMp4(secondaryFile));
      secondaryMediaType = "video";
    } else {
      const [optimized] = await toWebp([secondaryFile]);
      secondaryMediaUrl = await uploadSiteImageToR2("home", optimized);
      secondaryMediaType = "image";
    }
  }

  await saveSettings({
    store_name: String(formData.get("store_name") ?? "").trim(),
    announcement: String(formData.get("announcement") ?? "").trim(),
    contact_email: String(formData.get("contact_email") ?? "").trim(),
    instagram: String(formData.get("instagram") ?? "").trim(),
    shipping_flat_cents: Math.round(parseFloat(flat || "0") * 100),
    free_shipping_threshold_cents: Math.round(parseFloat(threshold || "0") * 100),
    shipping_rates_json: shippingRatesJson,
    pickup_points_json: JSON.stringify(pickupPoints),
    hero_image_url: heroImageUrl,
    hero_image_alt: String(formData.get("hero_image_alt") ?? "").trim(),
    hero_link_url: String(formData.get("hero_link_url") ?? "").trim(),
    hero_secondary_media_url: secondaryMediaUrl,
    hero_secondary_media_type: secondaryMediaType === "video" ? "video" : "image",
    hero_secondary_media_alt: String(formData.get("hero_secondary_media_alt") ?? "").trim(),
    hero_secondary_link_url: String(formData.get("hero_secondary_link_url") ?? "").trim(),
  });

  revalidatePath("/", "layout");
  redirect("/admin/parametres");
}
