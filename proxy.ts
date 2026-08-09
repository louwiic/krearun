import { NextResponse, type NextRequest } from "next/server";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/auth";

const PUBLIC_HOST = "krearun.re";

function getPublicOrigin(): string | null {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (configuredUrl) {
    try {
      const configured = new URL(configuredUrl);
      const isKrearunHost =
        configured.hostname === PUBLIC_HOST ||
        configured.hostname.endsWith(`.${PUBLIC_HOST}`);

      if (isKrearunHost) {
        // Le port 3000 est uniquement celui du conteneur Coolify. Il ne doit
        // jamais apparaître dans une URL envoyée au navigateur.
        configured.protocol = "https:";
        configured.hostname = PUBLIC_HOST;
        configured.port = "";
        return configured.origin;
      }
    } catch {}
  }

  // NEXT_PUBLIC_SITE_URL est injectée pendant le build par Next.js. Ce repli
  // protège la production si Coolify ne l'a rendue disponible qu'au runtime.
  return process.env.NODE_ENV === "production" ? `https://${PUBLIC_HOST}` : null;
}

function getRequestedHostname(req: NextRequest): string {
  const forwardedHost =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";

  return forwardedHost
    .split(",")[0]
    .trim()
    .replace(/:\d+$/, "")
    .toLowerCase();
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const publicOrigin = getPublicOrigin();
  const requestedHostname = getRequestedHostname(req);

  if (
    publicOrigin &&
    requestedHostname &&
    requestedHostname !== PUBLIC_HOST
  ) {
    const url = new URL(`${req.nextUrl.pathname}${req.nextUrl.search}`, publicOrigin);
    // 307 évite qu'un navigateur conserve définitivement une ancienne
    // redirection erronée vers le port interne.
    return NextResponse.redirect(url, 307);
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!(await verifyAdminToken(token))) {
      const url = publicOrigin
        ? new URL("/admin/login", publicOrigin)
        : req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("suivant", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml).*)"],
};
