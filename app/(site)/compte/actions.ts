"use server";

import { redirect } from "next/navigation";
import {
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
