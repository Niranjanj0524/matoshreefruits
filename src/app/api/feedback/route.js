import { connectDB } from "@/lib/db";
import Feedback from "@/models/Feedback";

/**
 * POST /api/feedback — public feedback form.
 *
 * Protections (basic in Phase 2, hardened further in Phase 4):
 *  - honeypot field: bots that fill it get a fake success and store nothing
 *  - field validation + length limits
 *  - per-IP throttle (in-memory; a single serverless instance at a time)
 * Submissions are stored with approved=false, so they are hidden from the
 * public site until an admin approves them.
 */

const LOCALES = ["mr", "hi", "en"];
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

/** ip -> { count, resetAt } — scoped to this server instance. */
const attempts = new Map();

function json(data, status = 200) {
  return Response.json(data, { status });
}

function isRateLimited(ip) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

function clientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  return forwarded.split(",")[0].trim() || "local";
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, code: "invalid" }, 400);
  }

  // Honeypot — humans never see this field.
  if (String(body.website ?? "").trim()) {
    return json({ ok: true });
  }

  const name = String(body.name ?? "").trim();
  const contact = String(body.contact ?? "").trim();
  const message = String(body.message ?? "").trim();
  const rawRating = body.rating;
  const rating =
    rawRating === null || rawRating === undefined || rawRating === ""
      ? null
      : Number(rawRating);
  const language = LOCALES.includes(body.language) ? body.language : "en";

  const validRating =
    rating === null || (Number.isInteger(rating) && rating >= 1 && rating <= 5);

  if (name.length < 2 || name.length > 120) return json({ ok: false, code: "invalid" }, 400);
  if (message.length < 5 || message.length > 2000)
    return json({ ok: false, code: "invalid" }, 400);
  if (contact.length > 120) return json({ ok: false, code: "invalid" }, 400);
  if (!validRating) return json({ ok: false, code: "invalid" }, 400);

  const ip = clientIp(request);
  if (isRateLimited(ip)) {
    return json({ ok: false, code: "rate_limited" }, 429);
  }

  try {
    await connectDB();
    await Feedback.create({ name, contact, message, rating, language, ip });
  } catch (err) {
    console.error("[feedback] save failed:", err.message);
    return json({ ok: false, code: "server" }, 500);
  }

  return json({ ok: true }, 201);
}
