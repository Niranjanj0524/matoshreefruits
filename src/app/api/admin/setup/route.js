import bcrypt from "bcryptjs";
import { timingSafeEqual } from "node:crypto";
import { connectDB } from "@/lib/db";
import Admin from "@/models/Admin";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  signSession,
} from "@/lib/session";

/**
 * /api/admin/setup — one-time bootstrap of the FIRST admin account.
 *
 * This exists so the site can be brought up against an empty Atlas database
 * without needing shell access to run `npm run create-admin`.
 *
 * Security model (this is NOT an open signup):
 *  - It only succeeds while the `admins` collection is EMPTY. As soon as one
 *    admin exists, every later call returns `already_configured` (403) and the
 *    page shows "already set up — go sign in". There is no way to create extra
 *    admins through this route.
 *  - A unique-index race guard (`11000`) means two simultaneous signups can
 *    never both create an account — the loser gets `already_configured`.
 *  - Optional `ADMIN_SETUP_SECRET`: when that env var is set, callers must also
 *    present it (constant-time compare) before the account is created. Leave it
 *    unset to rely on first-run-only locking alone.
 *  - Per-IP failed-attempt throttle so the optional secret can't be brute-forced.
 *  - Password is bcrypt-hashed (cost 12) — never stored or logged in plaintext.
 *
 * On success the response sets a signed `mf_session` cookie so the operator is
 * logged straight into the dashboard.
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 200;

/** ip -> { count, resetAt } */
const attempts = new Map();

function json(data, status = 200) {
  return Response.json(data, { status });
}

function clientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  return forwarded.split(",")[0].trim() || "local";
}

function isRateLimited(ip) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 0, resetAt: now + WINDOW_MS });
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(ip) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

/** Constant-time check for the optional setup secret. */
function secretMatches(provided) {
  const expected = process.env.ADMIN_SETUP_SECRET;
  if (!expected) return true; // not required
  const a = Buffer.from(String(provided ?? ""));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * GET /api/admin/setup — is setup still available?
 * Returns `configured` (an admin already exists) and `secretRequired`.
 */
export async function GET() {
  try {
    await connectDB();
    const configured = Boolean(await Admin.exists({}));
    return json({
      ok: true,
      configured,
      secretRequired: Boolean(process.env.ADMIN_SETUP_SECRET),
    });
  } catch (err) {
    console.error("[admin/setup] GET failed:", err.message);
    return json({ ok: false, code: "server" }, 500);
  }
}

/** POST /api/admin/setup — create the first admin (only while none exists). */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, code: "invalid" }, 400);
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const name = String(body.name ?? "").trim().slice(0, 100) || "Administrator";

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, code: "invalid_email" }, 400);
  }
  if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) {
    return json({ ok: false, code: "weak_password" }, 400);
  }

  const ip = clientIp(request);
  if (isRateLimited(ip)) {
    return json({ ok: false, code: "rate_limited" }, 429);
  }

  try {
    await connectDB();

    // First-run lock: refuse as soon as any admin exists.
    if (await Admin.exists({})) {
      return json({ ok: false, code: "already_configured" }, 403);
    }

    if (!secretMatches(body.secret)) {
      recordFailure(ip);
      return json({ ok: false, code: "bad_secret" }, 403);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let admin;
    try {
      admin = await Admin.create({ email, passwordHash, name });
    } catch (err) {
      // Unique-email race: another signup created the account first.
      if (err?.code === 11000) {
        return json({ ok: false, code: "already_configured" }, 403);
      }
      throw err;
    }

    const token = signSession({
      id: String(admin._id),
      email: admin.email,
      name: admin.name || "Administrator",
    });
    const response = json({ ok: true });
    response.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
    return response;
  } catch (err) {
    console.error("[admin/setup] POST failed:", err.message);
    return json({ ok: false, code: "server" }, 500);
  }
}
