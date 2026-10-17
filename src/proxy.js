import { NextResponse } from "next/server";

/**
 * Proxy (formerly middleware) — Next.js 16 convention.
 * Sends visitors landing on "/" to the default locale (Marathi).
 */
export function proxy(request) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/mr", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
