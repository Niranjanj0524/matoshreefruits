import { revalidateTag } from "next/cache";
import { connectDB } from "@/lib/db";
import Stock from "@/models/Stock";
import { adminGuard } from "@/lib/session";
import { validateStockInput } from "@/lib/admin";

/** /api/admin/stock — list all lots and create new ones (never a price). */

function json(data, status = 200) {
  return Response.json(data, { status });
}

export async function GET(request) {
  const denied = adminGuard(request);
  if (denied) return denied;

  try {
    await connectDB();
    const items = await Stock.find({}).sort({ createdAt: -1 }).limit(300).lean();
    return json({ ok: true, items });
  } catch (err) {
    console.error("[admin/stock] list failed:", err.message);
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

  const { error, data } = validateStockInput(body);
  if (error) return json({ ok: false, code: "invalid", message: error }, 400);

  try {
    await connectDB();
    const item = await Stock.create({
      ...data,
      lastUpdatedBy: "admin",
    });
    revalidateTag("stock", { expire: 0 });
    return json({ ok: true, item }, 201);
  } catch (err) {
    console.error("[admin/stock] create failed:", err.message);
    const status = err.name === "ValidationError" ? 400 : 500;
    return json({ ok: false, code: "invalid", message: err.message }, status);
  }
}
