"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import WhatsAppButton from "./WhatsAppButton";
import { MenuIcon, CloseIcon, InstagramIcon, WhatsAppIcon } from "./Icons";

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
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href={`/${locale}`}
          className="flex shrink-0 items-center gap-2.5"
          onClick={() => setOpen(false)}
        >
          <span
            aria-hidden="true"
            className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-sm"
          >
            <Image
              src="/logo.png"
              alt=""
              width={36}
              height={36}
              className="h-full w-full object-cover"
              priority
            />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-bold tracking-tight text-brand-dark sm:text-base">
              {brand}
            </span>
            <span className="hidden text-[11px] text-muted xl:block">
              {labels.tagline}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Main">
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
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={labels.whatsapp}
            className="hidden h-10 w-10 place-items-center rounded-xl bg-brand text-white transition hover:bg-brand-dark lg:grid"
          >
            <WhatsAppIcon className="h-5 w-5" />
          </a>
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
            className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-background text-brand-dark transition hover:bg-brand-soft xl:hidden"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-surface px-4 pb-5 pt-3 xl:hidden"
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
          <div className="mt-4 flex items-center gap-2">
            <WhatsAppButton
              href={whatsappHref}
              label={labels.whatsapp}
              size="lg"
              className="w-full"
            />
            {instagramHref && (
              <a
                href={instagramHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-line bg-background text-brand-dark transition hover:bg-brand-soft hover:text-brand"
              >
                <InstagramIcon className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
