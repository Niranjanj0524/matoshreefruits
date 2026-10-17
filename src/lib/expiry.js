import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import { destroyMediaList } from "@/lib/cloudinary";

/**
 * Expire overdue temporary posts (Phase 4).
 *
 * Temporary posts are hidden from every public page the moment `expiresAt`
 * passes (see livePostFilter in content.js) — this function finishes the job:
 * it destroys the Cloudinary assets (media costs money while stored) and then
 * removes the post documents, so nothing lingers in the database.
 *
 * Asset deletion is best-effort per post: if Cloudinary is unreachable the
 * post stays (still publicly invisible) and the next cron run retries.
 */
export async function expireOverduePosts({ now = new Date() } = {}) {
  await connectDB();

  const overdue = await Post.find({
    status: "published",
    type: "temporary",
    expiresAt: { $lt: now },
  }).lean();

  let destroyed = 0;
  const ids = [];
  for (const post of overdue) {
    destroyed += await destroyMediaList(post.media || []);
    ids.push(post._id);
  }

  if (ids.length > 0) {
    await Post.deleteMany({ _id: { $in: ids } });
  }

  return { removed: ids.length, destroyed };
}
