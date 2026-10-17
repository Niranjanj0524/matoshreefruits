import mongoose from "mongoose";
import { revalidateTag } from "next/cache";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import { adminGuard } from "@/lib/session";
import { validatePostInput, applyPublishing } from "@/lib/admin";
import { destroyMediaList } from "@/lib/cloudinary";

/**
 * /api/admin/posts/[id] — read / update / delete a single post.
 * Deleting a post also removes its Cloudinary assets (media hygiene) and
 * refreshes the public pages through the `posts` cache tag.
 */

function json(data, status = 200) {
  return Response.json(data, { status });
}

async function loadPost(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDB();
  return Post.findById(id).lean();
}

export async function GET(request, { params }) {
  const denied = adminGuard(request);
  if (denied) return denied;
  const { id } = await params;

  const post = await loadPost(id);
  if (!post) return json({ ok: false, code: "not_found" }, 404);
  return json({ ok: true, post });
}

export async function PATCH(request, { params }) {
  const denied = adminGuard(request);
  if (denied) return denied;
  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, code: "invalid" }, 400);
  }

  const { error, data } = validatePostInput(body, { partial: true });
  if (error) return json({ ok: false, code: "invalid", message: error }, 400);

  try {
    const existing = await loadPost(id);
    if (!existing) return json({ ok: false, code: "not_found" }, 404);

    const merged = { ...existing, ...data };
    const publishing = applyPublishing(existing, merged);

    const post = await Post.findByIdAndUpdate(
      id,
      { $set: { ...data, ...publishing } },
      { returnDocument: "after", runValidators: true }
    ).lean();

    revalidateTag("posts", { expire: 0 });
    return json({ ok: true, post });
  } catch (err) {
    console.error("[admin/posts] update failed:", err.message);
    const status = err.name === "ValidationError" ? 400 : 500;
    return json({ ok: false, code: "invalid", message: err.message }, status);
  }
}

export async function DELETE(request, { params }) {
  const denied = adminGuard(request);
  if (denied) return denied;
  const { id } = await params;

  try {
    const post = await loadPost(id);
    if (!post) return json({ ok: false, code: "not_found" }, 404);

    await Post.deleteOne({ _id: id });
    // Best-effort asset cleanup — the post is already gone either way.
    const destroyed = await destroyMediaList(post.media || []);

    revalidateTag("posts", { expire: 0 });
    return json({ ok: true, destroyed });
  } catch (err) {
    console.error("[admin/posts] delete failed:", err.message);
    return json({ ok: false, code: "server" }, 500);
  }
}
