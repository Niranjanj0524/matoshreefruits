import { notFound } from "next/navigation";
import { LOCALES, getMessages, isValidLocale } from "@/lib/i18n";
import { INSTAGRAM_URL } from "@/lib/site";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import Header from "./components/Header";
import Footer from "./components/Footer";
import "../globals.css";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = getMessages(isValidLocale(locale) ? locale : "mr");
  return {
    title: {
      default: t.meta.siteName,
      template: `%s | ${t.meta.siteName}`,
    },
    description: t.meta.description,
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}`])),
    },
  };
}

/** Root layout for the public site: header, nav, language switcher, footer. */
export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const t = getMessages(locale);
  const nav = [
    { href: `/${locale}`, label: t.nav.home },
    { href: `/${locale}/stock`, label: t.nav.stock },
    { href: `/${locale}/gallery`, label: t.nav.gallery },
    { href: `/${locale}/feedback`, label: t.nav.feedback },
    { href: `/${locale}/contact`, label: t.nav.contact },
  ];

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
        >
          {t.common.skipToContent}
        </a>
        <Header
          locale={locale}
          brand={t.meta.siteName}
          nav={nav}
          labels={{
            tagline: t.meta.tagline,
            menu: t.nav.menu,
            closeMenu: t.nav.closeMenu,
            language: t.nav.language,
            whatsapp: t.common.whatsappEnquiry,
            whatsappShort: t.common.whatsappEnquiry,
          }}
          whatsappHref={buildWhatsAppLink(t.whatsapp.greeting)}
          instagramHref={INSTAGRAM_URL}
        />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer locale={locale} nav={nav} t={t} />
      </body>
    </html>
  );
}
