"use server";

import { revalidatePath } from "next/cache";
import { updateCustomerProfile } from "@/lib/store";
import { customerProfileInput } from "@/lib/customer-profile";
import { redirect } from "next/navigation";
import {
  getCustomerSession,
  createCustomerSession,
  destroyCustomerSession,
  verifyCustomerCredentials,
} from "@/lib/customer-auth";

export async function customerLoginAction(
  _previous: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Renseignez votre e-mail et votre mot de passe." };
  const customer = await verifyCustomerCredentials(email, password);
  if (!customer) return { error: "E-mail ou mot de passe incorrect." };
  await createCustomerSession(customer);
  redirect("/compte");
}

export async function customerLogoutAction() {
  await destroyCustomerSession();
  redirect("/compte");
}

export async function saveCustomerProfileAction(_previous: {error?: string; success?: string}, data: FormData): Promise<{error?: string; success?: string}> {
  const session = await getCustomerSession();
  if (!session) return { error: "Reconnectez-vous pour modifier vos coordonnées." };
  let profile;
  try { profile = customerProfileInput(data); } catch (error) { return {error: error instanceof Error ? error.message : "Coordonnées invalides."}; }
  try {
    await updateCustomerProfile(session.id, profile);
    revalidatePath("/compte");
    return { success: "Coordonnées enregistrées. Les commandes déjà passées conservent leur adresse de livraison." };
  } catch { return {error: "Enregistrement impossible. Réessayez dans quelques instants."}; }
}
