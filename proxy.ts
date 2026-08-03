import { NextResponse, type NextRequest } from "next/server";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/auth";

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const canonicalUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (canonicalUrl) {
    try {
      const canonical = new URL(canonicalUrl);
      if (
        canonical.hostname.endsWith("krearun.re") &&
        req.nextUrl.hostname !== canonical.hostname
      ) {
        const url = req.nextUrl.clone();
        url.protocol = canonical.protocol;
        url.hostname = canonical.hostname;
        return NextResponse.redirect(url, 308);
      }
    } catch {}
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!(await verifyAdminToken(token))) {
      const url = req.nextUrl.clone();
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
