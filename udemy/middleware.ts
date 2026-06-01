import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const protectedPrefixes = ["/learn", "/dashboard", "/instructor", "/settings"];
const authRoutes = ["/auth"];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathnameWithoutLocale = pathname.replace(/^\/(en|ar)/, "") || "/";

  if (pathname.startsWith("/api")) {
    const response = NextResponse.next();
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    return response;
  }

  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token");

  const isProtected = protectedPrefixes.some((p) =>
    pathnameWithoutLocale.startsWith(p)
  );
  const isAuthRoute = authRoutes.some((p) =>
    pathnameWithoutLocale.startsWith(p)
  );

  if (isProtected && !sessionCookie) {
    const locale = pathname.match(/^\/(en|ar)/)?.[1] ?? "en";
    return NextResponse.redirect(
      new URL(`/${locale}/auth/sign-in`, request.url)
    );
  }

  if (isAuthRoute && sessionCookie) {
    const locale = pathname.match(/^\/(en|ar)/)?.[1] ?? "en";
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest|sw.js|workbox).*)",
  ],
};
