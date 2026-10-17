import { connection } from "next/server";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import Stock from "@/models/Stock";
import Feedback from "@/models/Feedback";

/**
 * Uncached admin reads (never `use cache` — the dashboard must show the
 * current database state). Each getter starts with `connection()`, which
 * stops prerendering: admin data is always computed per request (the session
 * gate in app/admin/(panel)/layout.js also renders at request time, so there
 * is no static shell to keep stale).
 */

export async function getAdminOverview() {
  await connection();
  await connectDB();
  const now = new Date();
  const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  const [
    postsTotal,
    postsPublished,
    postsDraft,
    postsExpiringSoon,
    stockLots,
    stockAvailable,
    feedbackPending,
    feedbackApproved,
    feedbackSpam,
    recentPosts,
    recentFeedback,
  ] = await Promise.all([
    Post.countDocuments({}),
    Post.countDocuments({ status: "published" }),
    Post.countDocuments({ status: "draft" }),
    Post.countDocuments({
      status: "published",
      type: "temporary",
      expiresAt: { $lte: inTwoDays },
    }),
    Stock.countDocuments({}),
    Stock.countDocuments({ available: true }),
    Feedback.countDocuments({ approved: false, spam: false }),
    Feedback.countDocuments({ approved: true, spam: false }),
    Feedback.countDocuments({ spam: true }),
    Post.find({}).sort({ updatedAt: -1 }).limit(5).lean(),
    Feedback.find({ approved: false, spam: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  return {
    counts: {
      postsTotal,
      postsPublished,
      postsDraft,
      postsExpiringSoon,
      stockLots,
      stockAvailable,
      feedbackPending,
      feedbackApproved,
      feedbackSpam,
    },
    recentPosts: JSON.parse(JSON.stringify(recentPosts)),
    recentFeedback: JSON.parse(JSON.stringify(recentFeedback)),
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

/** All posts for the admin list (drafts included), newest update first. */
export async function getPostsAdmin() {
  await connection();
  await connectDB();
  const posts = await Post.find({}).sort({ updatedAt: -1 }).limit(200).lean();
  return plain(posts);
}

/** One post for the editor, or null. */
export async function getPostAdmin(id) {
  await connection();
  const { default: mongoose } = await import("mongoose");
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDB();
  const post = await Post.findById(id).lean();
  return post ? plain(post) : null;
}

/** All stock lots for the admin table. */
export async function getStockAdmin() {
  await connection();
  await connectDB();
  const items = await Stock.find({}).sort({ createdAt: -1 }).limit(300).lean();
  return plain(items);
}

/** Feedback for moderation, newest first. */
export async function getFeedbackAdmin() {
  await connection();
  await connectDB();
  const items = await Feedback.find({}).sort({ createdAt: -1 }).limit(300).lean();
  return plain(items);
}
