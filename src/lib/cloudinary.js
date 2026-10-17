/**
 * Cloudinary helpers — signed browser uploads (Phase 3) and asset deletion
 * (Phase 3: admin removes media, Phase 4: expiry cron).
 *
 * Signing uses the documented algorithm: sorted `key=value` params joined with
 * `&`, the API secret appended, then SHA-1 (hex). The API secret never leaves
 * the server — the browser only receives a signature it cannot forge.
 */
import crypto from "node:crypto";

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export function getCloudinaryConfig() {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env.local."
    );
  }
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  };
}

/** Cloudinary request signature (SHA-1 of sorted params + api secret). */
export function cloudinarySignature(params, apiSecret) {
  const signable = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(signable + apiSecret).digest("hex");
}

/** Signature + public info the browser needs for a direct upload. */
export function uploadSignature({ folder = "matoshree/posts" } = {}) {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder, timestamp };
  return {
    cloudName,
    apiKey,
    folder,
    timestamp,
    signature: cloudinarySignature(params, apiSecret),
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
  };
}

/** Best-effort delete of one asset. Never throws (used in cleanup paths). */
export async function destroyCloudinaryAsset({ publicId, resourceType = "image" }) {
  if (!publicId || !isCloudinaryConfigured()) return { ok: false, skipped: true };
  try {
    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000);
    const params = { invalidate: true, public_id: publicId, timestamp };
    const body = new URLSearchParams({
      ...params,
      api_key: apiKey,
      signature: cloudinarySignature(params, apiSecret),
    });
    const type = resourceType === "video" ? "video" : "image";
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${type}/destroy`, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && data.result === "ok", result: data.result || null };
  } catch (err) {
    console.warn(`[cloudinary] destroy failed for ${publicId}:`, err.message);
    return { ok: false, error: err.message };
  }
}

/** Delete several media records (best-effort, logs failures). */
export async function destroyMediaList(media = []) {
  let destroyed = 0;
  for (const item of media) {
    const result = await destroyCloudinaryAsset({
      publicId: item?.publicId,
      resourceType: item?.resourceType,
    });
    if (result.ok) destroyed += 1;
  }
  return destroyed;
}
