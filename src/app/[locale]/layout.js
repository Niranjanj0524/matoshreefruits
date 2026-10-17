import { notFound } from "next/navigation";
import { LOCALES, getMessages, isValidLocale } from "@/lib/i18n";
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
  };
}

/** Root layout for the public site (localized segments). */
export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Header / nav / language switcher arrive in Phase 2 */}
        {children}
      </body>
    </html>
  );
}
