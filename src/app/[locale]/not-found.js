import Link from "next/link";
import { LOCALES, LOCALE_NAMES } from "@/lib/i18n";

/** 404 for unknown locales and unknown pages inside the localized site. */
export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-2xl">
        🍌
      </span>
      <h1 className="mt-5 text-3xl font-bold text-brand-dark">404</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        पृष्ठ सापडले नाही · पेज नहीं मिला · Page not found
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
        {LOCALES.map((l) => (
          <Link
            key={l}
            href={`/${l}`}
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
          >
            {LOCALE_NAMES[l]}
          </Link>
        ))}
      </div>
    </div>
  );
}
