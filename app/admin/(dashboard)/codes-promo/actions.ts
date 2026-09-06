"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import {
  createPromotionCode,
  setPromotionCodeActive,
} from "@/lib/promotion-codes";

function promoRedirect(type: "success" | "error", message: string): never {
  redirect(`/admin/codes-promo?${type}=${encodeURIComponent(message)}`);
}

function stripeErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return "Une erreur est survenue avec Stripe.";
  if (/already exists|already active|unique/i.test(error.message)) {
    return "Ce code promotionnel existe déjà dans Stripe.";
  }
  return error.message.slice(0, 240);
}

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function createPromotionCodeAction(formData: FormData) {
  await requireAdmin();

  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  const discountType = formData.get("discount_type") === "amount" ? "amount" : "percent";
  const value = Number(String(formData.get("value") ?? "").replace(",", "."));
  const maxRedemptions = Math.floor(Number(formData.get("max_redemptions") ?? 0));
  const minimumAmount = Number(
    String(formData.get("minimum_amount") ?? "").replace(",", ".")
  );
  const expirationDate = String(formData.get("expires_at") ?? "");

  if (!/^[A-Z0-9-]{3,50}$/.test(code)) {
    promoRedirect("error", "Le code doit contenir entre 3 et 50 lettres, chiffres ou tirets.");
  }
  if (!Number.isFinite(value) || value <= 0) {
    promoRedirect("error", "Indiquez une réduction supérieure à zéro.");
  }
  if (discountType === "percent" && value > 100) {
    promoRedirect("error", "Le pourcentage ne peut pas dépasser 100 %.");
  }

  const expiresAt = expirationDate
    ? Math.floor(new Date(`${expirationDate}T23:59:59+04:00`).getTime() / 1000)
    : undefined;
  if (expiresAt && expiresAt <= Math.floor(Date.now() / 1000)) {
    promoRedirect("error", "La date d’expiration doit être dans le futur.");
  }

  try {
    await createPromotionCode({
      code,
      discountType,
      value,
      expiresAt,
      maxRedemptions: maxRedemptions > 0 ? maxRedemptions : undefined,
      minimumAmountCents:
        Number.isFinite(minimumAmount) && minimumAmount > 0
          ? Math.round(minimumAmount * 100)
          : undefined,
      firstTimeOnly: formData.get("first_time_only") === "on",
    });
  } catch (error) {
    promoRedirect("error", stripeErrorMessage(error));
  }

  revalidatePath("/admin/codes-promo");
  promoRedirect("success", `Le code ${code} est actif.`);
}

export async function togglePromotionCodeAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!id.startsWith("promo_")) promoRedirect("error", "Code promotionnel invalide.");

  try {
    await setPromotionCodeActive(id, active);
  } catch (error) {
    promoRedirect("error", stripeErrorMessage(error));
  }

  revalidatePath("/admin/codes-promo");
  promoRedirect("success", active ? "Le code est réactivé." : "Le code est désactivé.");
}
