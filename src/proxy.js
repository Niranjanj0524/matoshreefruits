import { NextResponse } from "next/server";
import { LOCALES, DEFAULT_LOCALE } from "@/lib/i18n";

/**
 * Proxy (formerly middleware) — Next.js 16 convention.
 * Sends visitors landing on "/" to their remembered language (NEXT_LOCALE
 * cookie, saved by the language switcher) or to the default locale (Marathi).
 */
export function proxy(request) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const cookie = request.cookies.get("NEXT_LOCALE")?.value;
    const locale = LOCALES.includes(cookie) ? cookie : DEFAULT_LOCALE;
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
