import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Admin from "@/models/Admin";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  signSession,
} from "@/lib/session";

/**
 * POST /api/admin/login — email + password → signed session cookie.
 *
 * Protections:
 *  - per-IP attempt throttle (in-memory; enough for a single instance)
 *  - bcrypt compare against the stored hash (no plaintext anywhere)
 *  - constant-ish response time: a dummy compare when the email is unknown
 *  - generic error message (never reveals whether the email exists)
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;
/** ip -> { count, resetAt } */
const attempts = new Map();

// A pre-computed dummy hash so unknown-email logins cost the same as real ones.
const DUMMY_HASH = bcrypt.hashSync("matoshree-dummy-password", 10);

function clientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  return forwarded.split(",")[0].trim() || "local";
}

function isRateLimited(ip) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

function json(data, status = 200) {
  return Response.json(data, { status });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, code: "invalid" }, 400);
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!email || email.length > 254 || !password || password.length > 200) {
    return json({ ok: false, code: "invalid" }, 400);
  }

  const ip = clientIp(request);
  if (isRateLimited(ip)) {
    return json({ ok: false, code: "rate_limited" }, 429);
  }

  try {
    await connectDB();
    const admin = await Admin.findOne({ email }).lean();
    const hash = admin?.passwordHash || DUMMY_HASH;
    const valid = await bcrypt.compare(password, hash);
    if (!admin || !valid) {
      return json({ ok: false, code: "invalid" }, 401);
    }

    await Admin.updateOne(
      { _id: admin._id },
      { $set: { lastLoginAt: new Date() } }
    );

    const token = signSession({
      id: String(admin._id),
      email: admin.email,
      name: admin.name || "Administrator",
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
    return response;
  } catch (err) {
    console.error("[admin/login] failed:", err.message);
    return json({ ok: false, code: "server" }, 500);
  }
}
