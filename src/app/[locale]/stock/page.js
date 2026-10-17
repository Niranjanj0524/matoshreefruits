import { getMessages } from "@/lib/i18n";
import { getStockItems } from "@/lib/content";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import SectionHeading from "../components/SectionHeading";
import StockBrowser from "../components/StockBrowser";
import WhatsAppButton from "../components/WhatsAppButton";
import EmptyState from "../components/EmptyState";
import { BoxIcon } from "../components/Icons";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = getMessages(locale);
  return { title: t.stock.heading, description: t.stock.sub };
}

export default async function StockPage({ params }) {
  const { locale } = await params;
  const t = getMessages(locale);
  const items = await getStockItems({ limit: 60 });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading
        eyebrow={t.meta.tagline}
        title={t.stock.heading}
        subtitle={t.stock.sub}
        action={
          <WhatsAppButton
            href={buildWhatsAppLink(t.whatsapp.stockEnquiry)}
            label={t.common.whatsappEnquiry}
            variant="outline"
            className="shrink-0"
          />
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={BoxIcon}
          title={t.stock.empty}
          text={t.common.noPricing}
          action={
            <WhatsAppButton
              href={buildWhatsAppLink(t.whatsapp.stockEnquiry)}
              label={t.common.whatsappEnquiry}
            />
          }
        />
      ) : (
        <StockBrowser items={items} locale={locale} t={t} />
      )}

      <p className="mt-8 rounded-xl bg-accent-soft px-4 py-3 text-center text-sm font-medium text-brand-dark">
        {t.stock.requestRate}
      </p>
    </div>
  );
}
