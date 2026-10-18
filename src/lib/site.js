/**
 * Public site constants — business details shown on the Contact page and footer.
 * Values come from NEXT_PUBLIC_* env vars so they can be swapped without a code
 * change. Placeholders are marked in `.env.local.example` until real details are
 * supplied (Phase 5 launch checklist).
 */

export const BUSINESS_NAME = "Matoshree Fruits";

export const CONTACT = {
  phone: (process.env.NEXT_PUBLIC_PHONE || "").trim(),
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, ""),
  address: (process.env.NEXT_PUBLIC_ADDRESS || "").trim(),
  hours: (process.env.NEXT_PUBLIC_BUSINESS_HOURS || "").trim(),
  email: (process.env.NEXT_PUBLIC_BUSINESS_EMAIL || "").trim(),
  instagram: (process.env.NEXT_PUBLIC_INSTAGRAM || "").trim(),
};

/**
 * Normalized Instagram profile URL. Accepts a full URL (https://…) or just a
 * handle / @handle. Empty string when NEXT_PUBLIC_INSTAGRAM is unset, so the
 * header link stays hidden until a real handle is supplied (Phase 5 launch).
 */
export const INSTAGRAM_URL = (() => {
  const raw = CONTACT.instagram;
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://instagram.com/${raw.replace(/^@/, "")}`;
})();

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");
