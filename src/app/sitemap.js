import { LOCALES } from "@/lib/i18n";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const PAGES = ["", "stock", "gallery", "contact", "feedback"];

/** One sitemap entry per page × locale, with hreflang alternates. */
export default function sitemap() {
  const entries = [];

  for (const path of PAGES) {
    const suffix = path ? `/${path}` : "";
    entries.push({
      url: `${BASE}/${LOCALES[0]}${suffix}`,
      changeFrequency: path === "" ? "daily" : "weekly",
      priority: path === "" ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((locale) => [locale, `${BASE}/${locale}${suffix}`])
        ),
      },
    });
  }

  return entries;
}
