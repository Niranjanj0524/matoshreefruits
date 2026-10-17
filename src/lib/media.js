/**
 * Media helpers for Cloudinary-backed Post media.
 * Works with any URL — images fall through untouched when the URL is not a
 * Cloudinary asset (e.g. local /public files during development).
 */

export function mediaUrl(media) {
  return media?.secureUrl || media?.url || "";
}

export function isVideo(media) {
  return media?.resourceType === "video";
}

/**
 * Smaller Cloudinary variant for grid thumbnails.
 * `https://res.cloudinary.com/<cloud>/image/upload/v1/a.jpg`
 *   → `https://res.cloudinary.com/<cloud>/image/upload/w_900,q_auto,f_auto/v1/a.jpg`
 */
export function thumbnailUrl(media, width = 900) {
  const url = mediaUrl(media);
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }
  if (url.includes(`/upload/${width}`)) return url; // already transformed
  return url.replace(
    "/upload/",
    `/upload/w_${width},q_auto,f_auto/`
  );
}
