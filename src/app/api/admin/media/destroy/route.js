import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import { adminGuard } from "@/lib/session";
import { destroyCloudinaryAsset } from "@/lib/cloudinary";
import { revalidateTag } from "next/cache";

/**
 * POST /api/admin/media/destroy — delete one Cloudinary asset.
 * Body: { publicId, resourceType, postId? }
 * When `postId` is given, the asset is also removed from that post's media
 * array (used by "remove this photo/video" in the editor).
 */
export async function POST(request) {
  const denied = adminGuard(request);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, code: "invalid" }, { status: 400 });
  }

  const publicId = String(body.publicId ?? "");
  const resourceType = body.resourceType === "video" ? "video" : "image";
  const postId = String(body.postId ?? "");
  if (!publicId || publicId.length > 300) {
    return Response.json({ ok: false, code: "invalid" }, { status: 400 });
  }

  const result = await destroyCloudinaryAsset({ publicId, resourceType });

  let detached = false;
  if (postId) {
    try {
      await connectDB();
      const update = await Post.updateOne(
        { _id: postId },
        { $pull: { media: { publicId } } }
      );
      detached = update.modifiedCount > 0;
      if (detached) revalidateTag("posts", { expire: 0 });
    } catch (err) {
      console.error("[admin/media] detach failed:", err.message);
    }
  }

  return Response.json({ ok: true, destroyed: result.ok, detached });
}
