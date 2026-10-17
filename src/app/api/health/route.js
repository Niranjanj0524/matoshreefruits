import { dbStatus } from "@/lib/db";
import Admin from "@/models/Admin";
import Post from "@/models/Post";
import Stock from "@/models/Stock";
import Feedback from "@/models/Feedback";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — Phase 1 smoke test.
 * Reports MongoDB connectivity and document counts per model.
 */
export async function GET() {
  const startedAt = Date.now();
  const db = await dbStatus();

  if (!db.ok) {
    return Response.json(
      {
        ok: false,
        step: "connect",
        error: db.error,
        latencyMs: Date.now() - startedAt,
      },
      { status: 503 }
    );
  }

  try {
    const [admins, posts, stocks, feedback] = await Promise.all([
      Admin.countDocuments(),
      Post.countDocuments(),
      Stock.countDocuments(),
      Feedback.countDocuments(),
    ]);

    return Response.json({
      ok: true,
      db: "connected",
      readyState: db.state,
      counts: { admins, posts, stocks, feedback },
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        step: "models",
        error: err.message,
        latencyMs: Date.now() - startedAt,
      },
      { status: 500 }
    );
  }
}
