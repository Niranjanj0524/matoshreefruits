const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/** Public site is fully crawlable; the admin panel and APIs are not. */
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
