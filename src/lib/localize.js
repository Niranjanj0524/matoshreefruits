/**
 * Localised field access for model documents that carry `<field>Mr` / `<field>Hi`
 * variants next to the default (English) value.
 */
export function localizedField(item, locale, key) {
  if (!item) return "";
  if (locale === "mr" && item[`${key}Mr`]) return item[`${key}Mr`];
  if (locale === "hi" && item[`${key}Hi`]) return item[`${key}Hi`];
  return item[key] ?? "";
}

/** Date formatted for the active locale (mr-IN / hi-IN / en-IN). */
export function formatDate(iso, locale, options = { day: "numeric", month: "short" }) {
  if (!iso) return "";
  const tag = locale === "mr" ? "mr-IN" : locale === "hi" ? "hi-IN" : "en-IN";
  try {
    return new Intl.DateTimeFormat(tag, options).format(new Date(iso));
  } catch {
    return "";
  }
}
