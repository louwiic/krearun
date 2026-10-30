import { cookies } from "next/headers";
export type AdminNotice = { id: string; kind: "success" | "error"; message: string };
const COOKIE = "krearun_admin_notice";
export async function setAdminNotice(kind: AdminNotice["kind"], message: string) {
  const notice: AdminNotice = { id: crypto.randomUUID(), kind, message: message.slice(0, 300) };
  (await cookies()).set(COOKIE, encodeURIComponent(JSON.stringify(notice)), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" && process.env.LOCAL_PREVIEW !== "1", path: "/admin", maxAge: 60 });
}
export async function getAdminNotice(): Promise<AdminNotice | undefined> {
  try {
    const value = (await cookies()).get(COOKIE)?.value;
    const notice = JSON.parse(decodeURIComponent(value || ""));
    if (typeof notice.id === "string" && typeof notice.message === "string" && ["success", "error"].includes(notice.kind)) return { id: notice.id, kind: notice.kind, message: notice.message.slice(0, 300) };
  } catch {}
}
