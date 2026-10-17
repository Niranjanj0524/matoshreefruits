/**
 * Admin-side validation + publishing rules.
 *
 * Everything the admin APIs accept is validated and whitelisted here, so the
 * client can never mass-assign internal fields (publishedAt, expiresAt, ip…).
 * Public pages still never show a price: the Stock model has no price field and
 * nothing in this file adds one.
 */

const UNITS = ["crate", "box", "kg", "quintal", "truck", "bunch"];
const QUALITIES = ["premium", "grade-a", "grade-b", "ripening", "mixed"];
const STATUSES = ["draft", "published", "unpublished"];
const TYPES = ["temporary", "permanent"];
const RESOURCE_TYPES = ["image", "video"];

/** Temporary posts live 7 days from the moment they (re)become live. */
export const TEMPORARY_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function str(value, max) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.slice(0, max);
}

function int(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback;
}

/** Media records uploaded through /api/admin/upload-signature → Cloudinary. */
export function sanitizeMedia(value) {
  if (!Array.isArray(value)) return { error: "media must be an array" };
  if (value.length > 30) return { error: "too many media items (max 30)" };

  const media = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return { error: "invalid media item" };
    const publicId = str(item.publicId, 300);
    const url = str(item.url, 1000);
    const resourceType = String(item.resourceType || "");
    if (!publicId || !url || !RESOURCE_TYPES.includes(resourceType)) {
      return { error: "invalid media item" };
    }
    media.push({
      provider: "cloudinary",
      publicId,
      url,
      secureUrl: str(item.secureUrl || item.url, 1000),
      resourceType,
      format: str(item.format, 20),
      bytes: int(item.bytes),
      width: int(item.width),
      height: int(item.height),
      duration: Number(item.duration) >= 0 ? Number(item.duration) : 0,
    });
  }
  return { media };
}

/**
 * Decide publishedAt/expiresAt for a post being saved.
 * - An edit to an already-live post never extends its expiry.
 * - Publishing something that is not currently live (draft, unpublished, or an
 *   expired temporary post) stamps publishedAt=now and, for temporary posts,
 *   expiresAt=now+7 days.
 */
export function applyPublishing(previous, { status, type }) {
  const now = new Date();
  const out = {};

  const wasLive =
    previous.status === "published" &&
    Boolean(previous.publishedAt) &&
    (previous.type === "permanent" ||
      !previous.expiresAt ||
      new Date(previous.expiresAt) > now);

  if (status === "published") {
    if (!wasLive) {
      out.publishedAt = now;
      out.expiresAt = type === "temporary" ? new Date(now.getTime() + TEMPORARY_TTL_MS) : null;
    } else if (type === "permanent") {
      out.expiresAt = null;
    } else if (!previous.expiresAt) {
      // Live temporary post without an expiry (legacy data): pin it to 7 days
      // after it was published, not to "now", so edits don't extend it.
      out.expiresAt = new Date(
        new Date(previous.publishedAt).getTime() + TEMPORARY_TTL_MS
      );
    }
  }
  return out;
}

/**
 * Validate a post create/update payload.
 * `partial: true` (PATCH) allows saving without every field present.
 */
export function validatePostInput(body, { partial = false } = {}) {
  if (!body || typeof body !== "object") return { error: "invalid body" };

  const data = {};

  if (body.title !== undefined || !partial) {
    const title = str(body.title, 200);
    if (title.length < 2) return { error: "title is required (min 2 characters)" };
    data.title = title;
  }
  if (body.titleMr !== undefined) data.titleMr = str(body.titleMr, 200);
  if (body.titleHi !== undefined) data.titleHi = str(body.titleHi, 200);
  if (body.body !== undefined) data.body = str(body.body, 2000);
  if (body.bodyMr !== undefined) data.bodyMr = str(body.bodyMr, 2000);
  if (body.bodyHi !== undefined) data.bodyHi = str(body.bodyHi, 2000);

  if (body.type !== undefined || !partial) {
    if (!TYPES.includes(body.type)) return { error: "type must be temporary or permanent" };
    data.type = body.type;
  }
  if (body.status !== undefined || !partial) {
    if (!STATUSES.includes(body.status)) return { error: "invalid status" };
    data.status = body.status;
  }

  if (body.media !== undefined) {
    const result = sanitizeMedia(body.media);
    if (result.error) return { error: result.error };
    data.media = result.media;
  }

  // Never accept internal fields from the client.
  return { data };
}

export function validateStockInput(body, { partial = false } = {}) {
  if (!body || typeof body !== "object") return { error: "invalid body" };

  const data = {};

  if (body.variety !== undefined || !partial) {
    const variety = str(body.variety, 120);
    if (variety.length < 2) return { error: "variety is required (min 2 characters)" };
    data.variety = variety;
  }
  if (body.varietyMr !== undefined) data.varietyMr = str(body.varietyMr, 120);
  if (body.varietyHi !== undefined) data.varietyHi = str(body.varietyHi, 120);

  if (body.quantity !== undefined || !partial) {
    const quantity = Number(body.quantity);
    if (!Number.isFinite(quantity) || quantity < 0) return { error: "quantity must be a number ≥ 0" };
    data.quantity = quantity;
  }
  if (body.unit !== undefined) {
    if (!UNITS.includes(body.unit)) return { error: "invalid unit" };
    data.unit = body.unit;
  }
  if (body.quality !== undefined) {
    if (!QUALITIES.includes(body.quality)) return { error: "invalid quality" };
    data.quality = body.quality;
  }
  if (body.location !== undefined || !partial) {
    const location = str(body.location, 200);
    if (location.length < 2) return { error: "location is required" };
    data.location = location;
  }
  if (body.available !== undefined) data.available = Boolean(body.available);
  if (body.notes !== undefined) data.notes = str(body.notes, 1000);
  if (body.notesMr !== undefined) data.notesMr = str(body.notesMr, 1000);
  if (body.notesHi !== undefined) data.notesHi = str(body.notesHi, 1000);

  return { data };
}

export const ADMIN_ENUMS = { UNITS, QUALITIES, STATUSES, TYPES };
