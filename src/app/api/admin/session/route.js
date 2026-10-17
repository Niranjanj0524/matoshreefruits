import { getRequestSession } from "@/lib/session";

/** GET /api/admin/session — who am I? 401 when not signed in. */
export async function GET(request) {
  const session = getRequestSession(request);
  if (!session) {
    return Response.json({ ok: false, code: "unauthorized" }, { status: 401 });
  }
  return Response.json({
    ok: true,
    admin: { id: session.id, email: session.email, name: session.name },
  });
}
