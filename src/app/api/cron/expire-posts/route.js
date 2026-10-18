import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { expireOverduePosts } from "@/lib/expiry";

/**
 * /api/cron/expire-posts — scheduled cleanup of expired temporary posts.
 *
 * Destroys the Cloudinary assets of temporary posts whose 7-day window has
 * closed and deletes the post documents. Public pages already hide them via
 * the live-post filter; this reclaims the media storage.
 *
 * Auth: `Authorization: Bearer $CRON_SECRET` (same secret Vercel Cron sends).
 * Trigger it daily from any scheduler (vercel.json ships a cron config;
 * Vercel Hobby allows one run per day). Public pages already hide expired
 * posts at read time — this only reclaims Cloudinary storage.
 */

function json(data, status = 200) {
  return Response.json(data, { status });
}

function isAuthorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request) {
  if (!process.env.CRON_SECRET) {
    return json({ ok: false, code: "not_configured" }, 503);
  }
  if (!isAuthorized(request)) {
    return json({ ok: false, code: "unauthorized" }, 401);
  }

  try {
    const result = await expireOverduePosts();
    if (result.removed > 0) {
      revalidateTag("posts", { expire: 0 });
    }
    return json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/expire-posts] failed:", err.message);
    return json({ ok: false, code: "server" }, 500);
  }
}

/** Some schedulers prefer POST; identical behaviour. */
export async function POST(request) {
  return GET(request);
}
