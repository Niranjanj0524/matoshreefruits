import { cacheLife, cacheTag } from "next/cache";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import Stock from "@/models/Stock";
import Feedback from "@/models/Feedback";

/**
 * Public content queries.
 *
 * Every function uses Next.js 16 Cache Components (`"use cache"`) so pages can
 * be prerendered into a static shell while still reading MongoDB. Time-based
 * refresh comes from `cacheLife`, on-demand invalidation (admin edits in
 * Phase 3) from `cacheTag` + `revalidateTag/updateTag`.
 */

/** Mongoose documents → plain, serializable objects (cache output requirement). */
function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

/**
 * A post is publicly visible when it is published AND either permanent or not
 * yet past its 7-day expiry. Temporary posts therefore disappear automatically
 * from every public page.
 */
function livePostFilter() {
  return {
    status: "published",
    $or: [{ type: "permanent" }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  };
}

/** Live posts, newest first. `withMediaOnly` powers the gallery. */
export async function getLivePosts({ limit = 8, withMediaOnly = false } = {}) {
  "use cache";
  cacheLife("minutes");
  cacheTag("posts");

  await connectDB();
  const filter = livePostFilter();
  if (withMediaOnly) filter.media = { $ne: [] };

  const posts = await Post.find(filter)
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  return plain(posts);
}

/** Current stock lots, available first. */
export async function getStockItems({ limit = 50, availableOnly = false } = {}) {
  "use cache";
  cacheLife("minutes");
  cacheTag("stock");

  await connectDB();
  const filter = availableOnly ? { available: true } : {};

  const items = await Stock.find(filter)
    .sort({ available: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  return plain(items);
}

/** Approved public feedback, most recent first. */
export async function getApprovedFeedback({ limit = 6 } = {}) {
  "use cache";
  cacheLife("minutes");
  cacheTag("feedback");

  await connectDB();
  const items = await Feedback.find({ approved: true, spam: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return plain(items);
}
