import { revalidateTag } from "next/cache";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import { adminGuard } from "@/lib/session";
import { validatePostInput, applyPublishing } from "@/lib/admin";

/**
 * /api/admin/posts — list (including drafts) and create posts.
 * Every method requires the admin session cookie + same-origin writes.
 */

function json(data, status = 200) {
  return Response.json(data, { status });
}

export async function GET(request) {
  const denied = adminGuard(request);
  if (denied) return denied;

  try {
    await connectDB();
    const posts = await Post.find({})
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean();
    return json({ ok: true, posts });
  } catch (err) {
    console.error("[admin/posts] list failed:", err.message);
    return json({ ok: false, code: "server" }, 500);
  }
}

export async function POST(request) {
  const denied = adminGuard(request);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, code: "invalid" }, 400);
  }

  const { error, data } = validatePostInput(body);
  if (error) return json({ ok: false, code: "invalid", message: error }, 400);

  try {
    await connectDB();
    const post = await Post.create({
      ...data,
      ...applyPublishing({ status: "draft", type: data.type }, data),
    });
    revalidateTag("posts", { expire: 0 });
    return json({ ok: true, post }, 201);
  } catch (err) {
    console.error("[admin/posts] create failed:", err.message);
    const status = err.name === "ValidationError" ? 400 : 500;
    return json({ ok: false, code: "invalid", message: err.message }, status);
  }
}
