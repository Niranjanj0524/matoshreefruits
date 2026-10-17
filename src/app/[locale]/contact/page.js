import { getMessages } from "@/lib/i18n";
import { CONTACT, BUSINESS_NAME } from "@/lib/site";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import SectionHeading from "../components/SectionHeading";
import WhatsAppButton from "../components/WhatsAppButton";
import { PhoneIcon, MapPinIcon, ClockIcon, MailIcon, GlobeIcon } from "../components/Icons";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = getMessages(locale);
  return { title: t.contact.heading, description: t.contact.sub };
}

function ContactCard({ icon: Icon, label, value, href, unavailableLabel }) {
  const body = (
    <span className="flex items-start gap-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase tracking-wide text-muted">
          {label}
        </span>
        <span
          className={`mt-1 block break-words text-sm font-semibold sm:text-base ${
            value ? "text-foreground" : "text-muted"
          }`}
        >
          {value || unavailableLabel}
        </span>
      </span>
    </span>
  );

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
      {href ? (
        <a href={href} className="block transition hover:text-brand">
          {body}
        </a>
      ) : (
        body
      )}
    </div>
  );
}

export default async function ContactPage({ params }) {
  const { locale } = await params;
  const t = getMessages(locale);

  const cards = [
    {
      icon: PhoneIcon,
      label: t.contact.phone,
      value: CONTACT.phone,
      href: CONTACT.phone ? `tel:${CONTACT.phone.replace(/\s/g, "")}` : "",
    },
    {
      icon: MapPinIcon,
      label: t.contact.address,
      value: CONTACT.address,
      href: "",
    },
    { icon: ClockIcon, label: t.contact.hours, value: CONTACT.hours, href: "" },
    {
      icon: MailIcon,
      label: t.contact.email,
      value: CONTACT.email,
      href: CONTACT.email ? `mailto:${CONTACT.email}` : "",
    },
    { icon: GlobeIcon, label: t.contact.business, value: BUSINESS_NAME, href: "" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading
        eyebrow={t.meta.tagline}
        title={t.contact.heading}
        subtitle={t.contact.sub}
      />

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <ContactCard key={c.label} {...c} unavailableLabel={t.contact.unavailable} />
        ))}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl bg-brand p-6 text-white sm:p-8">
          <h2 className="text-xl font-bold sm:text-2xl">{t.contact.whatsapp}</h2>
          <p className="mt-2 text-sm text-white/85">{t.contact.note}</p>
          <div className="mt-6">
            <WhatsAppButton
              href={buildWhatsAppLink(t.whatsapp.greeting)}
              label={t.common.whatsappEnquiry}
              size="lg"
              variant="light"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
          <h2 className="text-lg font-bold text-brand-dark">{t.stock.heading}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t.stock.sub}</p>
          <p className="mt-4 rounded-xl bg-accent-soft px-4 py-3 text-sm font-medium text-brand-dark">
            {t.stock.requestRate}
          </p>
          <p className="mt-4 text-sm text-muted">{t.common.noPricing}</p>
        </div>
      </div>
    </div>
  );
}
