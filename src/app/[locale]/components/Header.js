"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import WhatsAppButton from "./WhatsAppButton";
import { MenuIcon, CloseIcon, InstagramIcon } from "./Icons";

/**
 * Site header: brand, primary nav, language switcher and the WhatsApp CTA.
 * Collapses into a drawer on mobile.
 *
 * @param {Array<{href: string, label: string}>} nav
 */
export default function Header({ locale, brand, nav, labels, whatsappHref, instagramHref }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href) =>
    href === `/${locale}`
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href={`/${locale}`}
          className="flex shrink-0 items-center gap-2.5"
          onClick={() => setOpen(false)}
        >
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-lg text-white shadow-sm"
          >
            🍌
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-bold tracking-tight text-brand-dark sm:text-base">
              {brand}
            </span>
            <span className="hidden text-[11px] text-muted sm:block">
              {labels.tagline}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-brand-soft text-brand-dark"
                    : "text-muted hover:bg-brand-soft/60 hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher locale={locale} label={labels.language} />
          <WhatsAppButton
            href={whatsappHref}
            label={labels.whatsappShort}
            className="hidden lg:inline-flex"
          />
          {instagramHref && (
            <a
              href={instagramHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hidden h-10 w-10 place-items-center rounded-xl border border-line bg-background text-brand-dark transition hover:bg-brand-soft hover:text-brand lg:grid"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? labels.closeMenu : labels.menu}
            className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-background text-brand-dark transition hover:bg-brand-soft md:hidden"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="border-t border-line bg-surface px-4 pb-5 pt-3 md:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {nav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-xl px-3 py-3 text-base font-medium transition ${
                    active
                      ? "bg-brand-soft text-brand-dark"
                      : "text-foreground hover:bg-brand-soft/60"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <WhatsAppButton
            href={whatsappHref}
            label={labels.whatsapp}
            size="lg"
            className="mt-4 w-full"
          />
        </div>
      )}
    </header>
  );
}
