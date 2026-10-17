import crypto from "node:crypto";
import { cookies } from "next/headers";

/**
 * Admin session: a stateless HMAC-SHA256 signed cookie (no extra dependency).
 *
 * Token format: `<base64url payload>.<base64url hmac>` where the payload holds
 * `{ id, email, name, exp }`. The signature covers the payload, so the value
 * cannot be tampered with; expiry is checked on every read.
 *
 * The cookie is httpOnly (never readable from JS) + sameSite=lax (+ secure in
 * production). Reading it in Server Components requires a <Suspense> boundary
 * when Cache Components is enabled — see app/admin/(dashboard)/layout.js.
 */
export const SESSION_COOKIE = "mf_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Add it to .env.local (see .env.local.example)."
    );
  }
  return secret;
}

function hmac(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function signSession({ id, email, name }) {
  const payload = Buffer.from(
    JSON.stringify({ id, email, name, exp: Date.now() + SESSION_MAX_AGE * 1000 })
  ).toString("base64url");
  return `${payload}.${hmac(payload)}`;
}

/** Returns the session payload, or null when missing/expired/tampered. */
export function verifySession(token) {
  if (typeof token !== "string") return null;
  const sep = token.indexOf(".");
  if (sep < 1) return null;
  const payload = token.slice(0, sep);
  const signature = token.slice(sep + 1);
  const expected = hmac(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

/** Server Component read (must sit behind a <Suspense> boundary). */
export async function getSession() {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** Route Handler read. */
export function getRequestSession(request) {
  return verifySession(request.cookies.get(SESSION_COOKIE)?.value);
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

/**
 * Guard for admin Route Handlers.
 * Returns `null` when the caller is an authenticated admin (same-origin for
 * writes), otherwise a ready-to-return 401/403 Response:
 *
 *   const denied = adminGuard(request);
 *   if (denied) return denied;
 */
export function adminGuard(request) {
  if (!getRequestSession(request)) {
    return Response.json({ ok: false, code: "unauthorized" }, { status: 401 });
  }
  const method = request.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    const origin = request.headers.get("origin");
    if (origin) {
      let sameOrigin = false;
      try {
        sameOrigin = new URL(origin).host === request.headers.get("host");
      } catch {
        sameOrigin = false;
      }
      if (!sameOrigin) {
        return Response.json({ ok: false, code: "csrf" }, { status: 403 });
      }
    }
  }
  return null;
}
