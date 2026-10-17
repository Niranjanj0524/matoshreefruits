import Link from "next/link";
import { getMessages } from "@/lib/i18n";
import { getLivePosts, getStockItems, getApprovedFeedback } from "@/lib/content";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { localizedField, formatDate } from "@/lib/localize";
import SectionHeading from "./components/SectionHeading";
import StockCard from "./components/StockCard";
import PostCard from "./components/PostCard";
import WhatsAppButton from "./components/WhatsAppButton";
import EmptyState from "./components/EmptyState";
import Stars from "./components/Stars";
import { ArrowRightIcon, BoxIcon, ShieldIcon, TruckIcon } from "./components/Icons";

const WHY_ICONS = [BoxIcon, ShieldIcon, TruckIcon];

export default async function HomePage({ params }) {
  const { locale } = await params;
  const t = getMessages(locale);

  const [posts, stock, feedback] = await Promise.all([
    getLivePosts({ limit: 3 }),
    getStockItems({ limit: 3, availableOnly: true }),
    getApprovedFeedback({ limit: 3 }),
  ]);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-brand-soft/70 via-background to-background">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-brand/15 blur-3xl"
        />

        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
              <span aria-hidden="true">🍌</span>
              {t.hero.eyebrow}
            </p>

            <h1 className="mt-5 text-3xl font-bold leading-[1.12] tracking-tight text-brand-dark sm:text-5xl">
              {t.hero.heading}
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              {t.hero.sub}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <WhatsAppButton
                href={buildWhatsAppLink(t.whatsapp.greeting)}
                label={t.common.whatsappEnquiry}
                size="lg"
              />
              <Link
                href={`/${locale}/stock`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-brand/40 bg-surface px-6 py-3 text-base font-semibold text-brand-dark transition hover:bg-brand-soft"
              >
                {t.hero.primaryCta}
                <ArrowRightIcon />
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap gap-2.5">
              {t.hero.chips.map((chip) => (
                <li
                  key={chip}
                  className="rounded-full bg-surface px-3.5 py-1.5 text-xs font-medium text-muted shadow-sm ring-1 ring-line"
                >
                  {chip}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative hidden lg:block">
            <div className="rounded-3xl border border-line bg-surface p-6 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t.stock.heading}
              </p>
              <div className="mt-4 space-y-3">
                {stock.length > 0 ? (
                  stock.slice(0, 3).map((item) => {
                    const unit = t.stock.units[item.unit] || item.unit;
                    const grade = t.stock.qualities[item.quality] || item.quality;
                    return (
                      <div
                        key={item._id}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-background p-4"
                      >
                        <div>
                          <p className="text-sm font-bold text-brand-dark">
                            {localizedField(item, locale, "variety")}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {item.quantity} {unit} · {grade} · {item.location}
                          </p>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand-dark">
                          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                          {t.common.available}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="rounded-2xl bg-background p-6 text-sm text-muted">
                    {t.home.stockPreview.empty}
                  </p>
                )}
              </div>
              <Link
                href={`/${locale}/stock`}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
              >
                {t.home.stockPreview.cta}
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Fresh arrivals ───────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <SectionHeading
          eyebrow={t.meta.tagline}
          title={t.home.freshArrivals.title}
          subtitle={t.home.freshArrivals.sub}
          action={
            <Link
              href={`/${locale}/gallery`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-brand-dark transition hover:border-brand/40 hover:bg-brand-soft"
            >
              {t.home.freshArrivals.cta}
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          }
        />

        {posts.length === 0 ? (
          <EmptyState
            icon={BoxIcon}
            title={t.home.freshArrivals.empty}
            text={t.common.noPricing}
            action={
              <WhatsAppButton
                href={buildWhatsAppLink(t.whatsapp.greeting)}
                label={t.common.whatsappEnquiry}
                variant="outline"
              />
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} locale={locale} t={t} />
            ))}
          </div>
        )}
      </section>

      {/* ── Stock preview ────────────────────────────────────── */}
      <section className="border-y border-line bg-surface/60">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <SectionHeading
            title={t.home.stockPreview.title}
            subtitle={t.home.stockPreview.sub}
            action={
              <Link
                href={`/${locale}/stock`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-brand-dark transition hover:border-brand/40 hover:bg-brand-soft"
              >
                {t.home.stockPreview.cta}
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            }
          />

          {stock.length === 0 ? (
            <EmptyState
              icon={BoxIcon}
              title={t.home.stockPreview.empty}
              action={
                <WhatsAppButton
                  href={buildWhatsAppLink(t.whatsapp.stockEnquiry)}
                  label={t.common.whatsappEnquiry}
                  variant="outline"
                />
              }
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {stock.map((item) => (
                <StockCard key={item._id} item={item} locale={locale} t={t} compact />
              ))}
            </div>
          )}

          <p className="mt-6 rounded-xl bg-accent-soft px-4 py-3 text-center text-sm font-medium text-brand-dark">
            {t.stock.requestRate}
          </p>
        </div>
      </section>

      {/* ── Why us ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <SectionHeading title={t.home.whyUs.title} />
        <div className="grid gap-5 md:grid-cols-3">
          {t.home.whyUs.items.map((item, i) => {
            const Icon = WHY_ICONS[i] || BoxIcon;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-line bg-surface p-6 shadow-sm"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-bold text-brand-dark">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="border-y border-line bg-surface/60">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <SectionHeading
            title={t.home.testimonials.title}
            subtitle={t.home.testimonials.sub}
          />
          {feedback.length === 0 ? (
            <EmptyState
              title={t.home.testimonials.empty}
              action={
                <Link
                  href={`/${locale}/feedback`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
                >
                  {t.feedback.heading}
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              }
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {feedback.map((item) => (
                <figure
                  key={item._id}
                  className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 shadow-sm"
                >
                  <Stars rating={item.rating} />
                  <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground">
                    “{item.message}”
                  </blockquote>
                  <figcaption className="mt-4 flex items-center justify-between gap-3 text-xs text-muted">
                    <span className="font-semibold text-brand-dark">{item.name}</span>
                    <span>{formatDate(item.createdAt, locale)}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="relative overflow-hidden rounded-3xl bg-brand px-6 py-12 text-center sm:px-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/30 blur-2xl"
          />
          <h2 className="relative text-2xl font-bold text-white sm:text-3xl">
            {t.home.cta.heading}
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-sm text-white/85 sm:text-base">
            {t.home.cta.text}
          </p>
          <div className="relative mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <WhatsAppButton
              href={buildWhatsAppLink(t.whatsapp.greeting)}
              label={t.home.cta.button}
              size="lg"
              variant="light"
            />
            <Link
              href={`/${locale}/contact`}
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
            >
              {t.hero.secondaryCta}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
