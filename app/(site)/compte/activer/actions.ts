"use server";

import { redirect } from "next/navigation";
import { activateCustomerPassword } from "@/lib/store";

export async function activateAccountAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  if (!token) redirect("/compte/activer?error=lien");
  if (password !== passwordConfirm) {
    redirect(`/compte/activer?token=${encodeURIComponent(token)}&error=confirm`);
  }

  const result = await activateCustomerPassword(token, password);
  if (!result.ok) {
    const error = result.reason?.includes("10") ? "short" : "invalid";
    redirect(`/compte/activer?token=${encodeURIComponent(token)}&error=${error}`);
  }

  redirect("/compte/activer?success=1");
}
