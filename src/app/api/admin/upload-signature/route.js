import { adminGuard } from "@/lib/session";
import { isCloudinaryConfigured, uploadSignature } from "@/lib/cloudinary";

/**
 * POST /api/admin/upload-signature — signed params for a *direct* browser →
 * Cloudinary upload. The file never passes through the Next.js server (no
 * serverless body-size limit), and the API secret never leaves the server —
 * only a signature the browser cannot forge.
 */
export async function POST(request) {
  const denied = adminGuard(request);
  if (denied) return denied;

  if (!isCloudinaryConfigured()) {
    return Response.json(
      { ok: false, code: "not_configured", message: "Cloudinary is not configured." },
      { status: 503 }
    );
  }

  return Response.json({ ok: true, ...uploadSignature() });
}
