import { getMessages } from "@/lib/i18n";

/**
 * Phase 1 placeholder homepage — proves locale routing + messages work.
 * The real design-driven homepage is built in Phase 2.
 */
export default async function HomePage({ params }) {
  const { locale } = await params;
  const t = getMessages(locale);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl rounded-2xl border border-line bg-surface p-10 shadow-sm">
        <p className="mb-4 inline-block rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-brand-dark">
          🍌 {t.meta.tagline}
        </p>
        <h1 className="text-3xl font-bold text-brand-dark sm:text-4xl">
          {t.welcome.heading}
        </h1>
        <p className="mt-4 text-muted">{t.welcome.phase}</p>
        <div className="mt-6 flex items-center gap-3 text-sm text-muted">
          <span className="h-2 w-2 rounded-full bg-brand" />
          <span>
            Locale: <strong className="text-foreground">{locale}</strong>
          </span>
        </div>
      </div>
    </main>
  );
}
