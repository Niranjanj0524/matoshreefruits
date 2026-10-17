import { getMessages } from "@/lib/i18n";
import { getApprovedFeedback } from "@/lib/content";
import { formatDate } from "@/lib/localize";
import SectionHeading from "../components/SectionHeading";
import FeedbackForm from "../components/FeedbackForm";
import Stars from "../components/Stars";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = getMessages(locale);
  return { title: t.feedback.heading, description: t.feedback.sub };
}

export default async function FeedbackPage({ params }) {
  const { locale } = await params;
  const t = getMessages(locale);
  const items = await getApprovedFeedback({ limit: 12 });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading
        eyebrow={t.meta.tagline}
        title={t.feedback.heading}
        subtitle={t.feedback.sub}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8">
          <FeedbackForm locale={locale} t={t} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-brand-dark">
            {t.feedback.testimonials.heading}
          </h2>

          {items.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-10 text-center text-sm text-muted">
              {t.feedback.testimonials.empty}
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {items.map((item) => (
                <li
                  key={item._id}
                  className="rounded-2xl border border-line bg-surface p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-brand-dark">
                      {item.name}
                    </span>
                    <span className="text-xs text-muted">
                      {formatDate(item.createdAt, locale, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {item.rating ? (
                    <div className="mt-2">
                      <Stars rating={item.rating} />
                    </div>
                  ) : null}
                  <p className="mt-3 text-sm leading-relaxed text-foreground">
                    {item.message}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-5 rounded-xl bg-accent-soft px-4 py-3 text-xs font-medium text-brand-dark">
            {t.feedback.form.successNote}
          </p>
        </div>
      </div>
    </div>
  );
}
