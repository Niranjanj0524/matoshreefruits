import mongoose from "mongoose";
import { revalidateTag } from "next/cache";
import { connectDB } from "@/lib/db";
import Feedback from "@/models/Feedback";
import { adminGuard } from "@/lib/session";

/**
 * /api/admin/feedback — list submissions (all statuses) and change them.
 * Approving a message publishes it on the public feedback wall, so the
 * `feedback` cache tag is invalidated on every change.
 */

function json(data, status = 200) {
  return Response.json(data, { status });
}

export async function GET(request) {
  const denied = adminGuard(request);
  if (denied) return denied;

  try {
    await connectDB();
    const items = await Feedback.find({})
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();
    return json({ ok: true, items });
  } catch (err) {
    console.error("[admin/feedback] list failed:", err.message);
    return json({ ok: false, code: "server" }, 500);
  }
}

export async function PATCH(request) {
  const denied = adminGuard(request);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, code: "invalid" }, 400);
  }

  const id = String(body.id ?? "");
  if (!mongoose.isValidObjectId(id)) return json({ ok: false, code: "invalid" }, 400);

  const set = {};
  if (typeof body.approved === "boolean") set.approved = body.approved;
  if (typeof body.spam === "boolean") set.spam = body.spam;
  if (Object.keys(set).length === 0) return json({ ok: false, code: "invalid" }, 400);

  try {
    await connectDB();
    const item = await Feedback.findByIdAndUpdate(
      id,
      { $set: set },
      { returnDocument: "after" }
    ).lean();
    if (!item) return json({ ok: false, code: "not_found" }, 404);

    revalidateTag("feedback", { expire: 0 });
    return json({ ok: true, item });
  } catch (err) {
    console.error("[admin/feedback] update failed:", err.message);
    return json({ ok: false, code: "server" }, 500);
  }
}

export async function DELETE(request) {
  const denied = adminGuard(request);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, code: "invalid" }, 400);
  }

  const id = String(body.id ?? "");
  if (!mongoose.isValidObjectId(id)) return json({ ok: false, code: "invalid" }, 400);

  try {
    await connectDB();
    const result = await Feedback.deleteOne({ _id: id });
    if (result.deletedCount === 0) return json({ ok: false, code: "not_found" }, 404);

    revalidateTag("feedback", { expire: 0 });
    return json({ ok: true });
  } catch (err) {
    console.error("[admin/feedback] delete failed:", err.message);
    return json({ ok: false, code: "server" }, 500);
  }
}
