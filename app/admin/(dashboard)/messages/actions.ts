"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { sendContactReply } from "@/lib/contact-inbox";

export async function sendContactReplyAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");
  const uid = String(formData.get("uid") || "").trim();
  const to = String(formData.get("to") || "").trim().toLowerCase();
  const subject = String(formData.get("subject") || "").trim().slice(0, 200);
  const text = String(formData.get("text") || "").trim().slice(0, 10000);
  if (!/^\d+$/.test(uid) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to) || !text) {
    redirect(`/admin/messages?uid=${encodeURIComponent(uid)}&error=reply`);
  }
  try {
    await sendContactReply(to, subject.startsWith("Re:") ? subject : `Re: ${subject}`, text);
    revalidatePath("/admin/messages");
    redirect(`/admin/messages?uid=${uid}&sent=1`);
  } catch {
    redirect(`/admin/messages?uid=${uid}&error=send`);
  }
}
