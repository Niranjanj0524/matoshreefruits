import { NextResponse } from "next/server";
import { LOCALES, DEFAULT_LOCALE } from "@/lib/i18n";

/**
 * Proxy (formerly middleware) — Next.js 16 convention.
 *
 * 1. "/" → visitors go to their remembered language (NEXT_LOCALE cookie) or
 *    the default locale (Hindi).
 * 2. /admin/* (except the login page) requires a valid mf_session cookie.
 *    The HMAC check runs HERE — before any rendering — because a guard inside
 *    a layout can still let Next serialize the page segment (with live DB
 *    data) into the RSC payload. Admin APIs re-verify the session too.
 */

const SESSION_COOKIE = "mf_session";

/** base64url helpers matching src/lib/session.js (Node crypto uses the same). */
function b64urlFromBytes(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(text) {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/");
  const withPadding = padded + "=".repeat((4 - (padded.length % 4)) % 4);
  const bin = atob(withPadding);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** HMAC-SHA256 signature + expiry check, edge-runtime safe (Web Crypto). */
async function isValidSession(token) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || typeof token !== "string") return false;

  const sep = token.indexOf(".");
  if (sep < 1) return false;
  const payload = token.slice(0, sep);
  const signature = token.slice(sep + 1);

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    const expected = b64urlFromBytes(new Uint8Array(mac));
    if (expected.length !== signature.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    if (diff !== 0) return false;

    const data = JSON.parse(b64urlDecode(payload));
    return typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const cookie = request.cookies.get("NEXT_LOCALE")?.value;
    const locale = LOCALES.includes(cookie) ? cookie : DEFAULT_LOCALE;
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    // Public admin routes that must be reachable WITHOUT a session:
    //  - /admin/login : sign in
    //  - /admin/setup : one-time bootstrap of the first admin (self-disables)
    const PUBLIC_ADMIN_ROUTES = ["/admin/login", "/admin/setup"];
    if (!PUBLIC_ADMIN_ROUTES.includes(pathname)) {
      const token = request.cookies.get(SESSION_COOKIE)?.value;
      if (!(await isValidSession(token))) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*"],
};
