"use server";

import { isAdmin } from "@/lib/auth";
import { saveSettings } from "@/lib/store";
import { isSiteSkin } from "@/lib/site-skins";
import { revalidatePath } from "next/cache";

export async function saveSiteSkinAction(_previous: { error?: string; saved?: boolean }, form: FormData): Promise<{ error?: string; saved?: boolean }> {
  if (!(await isAdmin())) return { error: "Connectez-vous à l’administration pour modifier l’apparence." };
  const skin = form.get("site_skin");
  if (!isSiteSkin(skin)) return { error: "Choisissez un skin disponible." };
  try {
    const enabled = form.get("site_skin_enabled") === "on";
    const saved = await saveSettings({ site_skin: skin, site_skin_enabled: enabled });
    if (saved.site_skin !== skin || saved.site_skin_enabled !== enabled) throw new Error("Skin not persisted");
    revalidatePath("/", "layout");
    revalidatePath("/admin/parametres");
    return { saved: true };
  } catch {
    return { error: "Impossible d’enregistrer le skin. Réessayez." };
  }
}
