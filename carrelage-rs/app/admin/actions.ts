"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual, createHash } from "node:crypto";
import { signature } from "@/lib/admin";

export async function login(form: FormData) {
  const configured = process.env.ADMIN_PASSWORD;
  const hash = (s: string) => createHash("sha256").update(s).digest();
  if (
    !configured ||
    !timingSafeEqual(hash(String(form.get("password") || "")), hash(configured))
  ) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    redirect("/admin/login?error=1");
  }
  const expires = String(Date.now() + 8 * 60 * 60 * 1000);
  (await cookies()).set("rs-admin", `${expires}.${signature(expires)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 28800,
  });
  redirect("/admin");
}
export async function logout() {
  (await cookies()).delete("rs-admin");
  redirect("/admin/login");
}
