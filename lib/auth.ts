import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "cocon_admin";

function secret() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET || "cocon-studio-dev-secret"
  );
}

export async function createAdminSession() {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secret());
    return true;
  } catch {
    return false;
  }
}

export async function verifyAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, secret());
    return true;
  } catch {
    return false;
  }
}

export const ADMIN_COOKIE = COOKIE_NAME;

// Vérifie les identifiants admin boutique auprès de PocketBase
// (collection auth "boutique_admins" — comptes gérés depuis l'interface /_/).
export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<boolean> {
  const url = (process.env.POCKETBASE_URL ?? "").replace(/\/$/, "");
  if (!url) return false;
  try {
    const res = await fetch(
      `${url}/api/collections/boutique_admins/auth-with-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: email, password }),
        cache: "no-store",
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}
