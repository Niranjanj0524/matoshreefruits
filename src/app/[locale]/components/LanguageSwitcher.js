"use client";

import { usePathname, useRouter } from "next/navigation";
import { LOCALES, LOCALE_NAMES } from "@/lib/i18n";
import { GlobeIcon } from "./Icons";

/**
 * Marathi / Hindi / English switcher.
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
    // document.cookie as readable state, so it is disabled for this line.
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;

    const rest = pathname.split("/").slice(2).filter(Boolean).join("/");
    router.push(`/${next}${rest ? `/${rest}` : ""}`);
  }

  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center gap-1 rounded-full border border-line bg-background p-1"
    >
      <GlobeIcon className="ml-1.5 hidden h-4 w-4 text-muted sm:block" />
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => switchTo(l)}
            aria-pressed={active}
            lang={l}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition sm:px-3 ${
              active
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:bg-brand-soft hover:text-brand-dark"
            }`}
          >
            {LOCALE_NAMES[l]}
          </button>
        );
      })}
    </div>
  );
}
