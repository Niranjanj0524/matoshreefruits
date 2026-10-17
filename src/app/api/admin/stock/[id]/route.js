import mongoose from "mongoose";
import { revalidateTag } from "next/cache";
import { connectDB } from "@/lib/db";
import Stock from "@/models/Stock";
import { adminGuard } from "@/lib/session";
import { validateStockInput } from "@/lib/admin";

/** /api/admin/stock/[id] — update availability/details or remove a lot. */

function json(data, status = 200) {
  return Response.json(data, { status });
}

export async function PATCH(request, { params }) {
  const denied = adminGuard(request);
  if (denied) return denied;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return json({ ok: false, code: "not_found" }, 404);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, code: "invalid" }, 400);
  }

  const { error, data } = validateStockInput(body, { partial: true });
  if (error) return json({ ok: false, code: "invalid", message: error }, 400);

  try {
    await connectDB();
    const item = await Stock.findByIdAndUpdate(
      id,
      { $set: { ...data, lastUpdatedBy: "admin" } },
      { returnDocument: "after", runValidators: true }
    ).lean();
    if (!item) return json({ ok: false, code: "not_found" }, 404);

    revalidateTag("stock", { expire: 0 });
    return json({ ok: true, item });
  } catch (err) {
    console.error("[admin/stock] update failed:", err.message);
    const status = err.name === "ValidationError" ? 400 : 500;
    return json({ ok: false, code: "invalid", message: err.message }, status);
  }
}

export async function DELETE(request, { params }) {
  const denied = adminGuard(request);
  if (denied) return denied;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return json({ ok: false, code: "not_found" }, 404);

  try {
    await connectDB();
    const result = await Stock.deleteOne({ _id: id });
    if (result.deletedCount === 0) return json({ ok: false, code: "not_found" }, 404);

    revalidateTag("stock", { expire: 0 });
    return json({ ok: true });
  } catch (err) {
    console.error("[admin/stock] delete failed:", err.message);
    return json({ ok: false, code: "server" }, 500);
  }
}
