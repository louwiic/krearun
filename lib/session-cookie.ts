import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

function configuredCookieDomain() {
  const explicit = process.env.AUTH_COOKIE_DOMAIN?.trim();
  if (explicit) return explicit;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return undefined;

  try {
    const hostname = new URL(siteUrl).hostname.toLowerCase();
    if (hostname === "krearun.re" || hostname.endsWith(".krearun.re")) {
      return ".krearun.re";
    }
  } catch {}

  return undefined;
}

export function sessionCookieOptions(maxAge = THIRTY_DAYS): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge,
    path: "/",
    domain: configuredCookieDomain(),
  };
}

