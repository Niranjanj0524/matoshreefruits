"use client";

import { usePathname, useRouter } from "next/navigation";
import { LOCALES, LOCALE_NAMES } from "@/lib/i18n";
import { GlobeIcon } from "./Icons";

/**
 * Marathi / Hindi / English switcher (dropdown).
 * Keeps the visitor on the same page in the other language and remembers the
 * choice in a NEXT_LOCALE cookie (read by src/proxy.js for the "/" redirect).
 */
export default function LanguageSwitcher({ locale, label = "Language" }) {
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next) {
    if (next === locale) return;

    // Writing a browser cookie is an intentional external side effect of the
    // click, not a render-time mutation — the lint rule does not model
    // document.cookie as readable state.
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;

    const rest = pathname.split("/").slice(2).filter(Boolean).join("/");
    router.push(`/${next}${rest ? `/${rest}` : ""}`);
  }

  return (
    <div className="relative flex items-center">
      <GlobeIcon className="pointer-events-none absolute left-2.5 h-4 w-4 text-muted" />
      <select
        aria-label={label}
        value={locale}
        onChange={(e) => switchTo(e.target.value)}
        className="h-9 appearance-none rounded-full border border-line bg-background py-1 pl-8 pr-8 text-xs font-semibold text-foreground transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l} lang={l}>
            {LOCALE_NAMES[l]}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-muted"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}
