import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

export function signature(value: string) {
  return createHmac("sha256", process.env.ADMIN_PASSWORD || "unconfigured")
    .update(value)
    .digest("hex");
}
export async function isAdmin() {
  if (!process.env.ADMIN_PASSWORD) return false;
  const token = (await cookies()).get("rs-admin")?.value || "";
  const [expires, signed] = token.split(".");
  if (!signed || !/^\d+$/.test(expires) || Number(expires) < Date.now())
    return false;
  const expected = signature(expires);
  return (
    signed.length === expected.length &&
    timingSafeEqual(Buffer.from(signed), Buffer.from(expected))
  );
}
