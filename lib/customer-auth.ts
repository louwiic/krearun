import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "krearun_customer";

function secret() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET || "krearun-studio-dev-secret"
  );
}

export interface CustomerSession {
  id: string;
  email: string;
}

export async function verifyCustomerCredentials(
  email: string,
  password: string
): Promise<CustomerSession | null> {
  const url = (process.env.POCKETBASE_URL ?? "").replace(/\/$/, "");
  if (!url) return null;
  try {
    const response = await fetch(`${url}/api/collections/customers/auth-with-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity: email.trim().toLowerCase(), password }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { record?: { id?: string; email?: string } };
    if (!data.record?.id || !data.record.email) return null;
    return { id: data.record.id, email: data.record.email };
  } catch {
    return null;
  }
}

export async function createCustomerSession(customer: CustomerSession) {
  const token = await new SignJWT({ role: "customer", email: customer.email })
    .setSubject(customer.id)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.role !== "customer" || !payload.sub || typeof payload.email !== "string") {
      return null;
    }
    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export async function destroyCustomerSession() {
  (await cookies()).delete(COOKIE_NAME);
}
