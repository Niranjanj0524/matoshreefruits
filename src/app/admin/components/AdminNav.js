"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: "▦" },
  { href: "/admin/posts", label: "Posts & media", icon: "▣" },
  { href: "/admin/stock", label: "Stock", icon: "▤" },
  { href: "/admin/feedback", label: "Feedback", icon: "✉" },
];

/** Sidebar (desktop) + horizontal nav (mobile) + logout. */
export default function AdminNav({ name, email }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  function isActive(href) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface lg:flex">
        <div className="border-b border-line px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-sm font-black text-white">
              MF
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-brand-dark">Matoshree Fruits</p>
              <p className="truncate text-xs text-muted">Admin panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive(link.href)
                  ? "bg-brand text-white"
                  : "text-foreground hover:bg-brand-soft hover:text-brand-dark"
              }`}
            >
              <span aria-hidden="true" className="w-4 text-center">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <Link
            href="/"
            className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted transition hover:bg-brand-soft hover:text-brand-dark"
          >
            ↗ View public site
          </Link>
          <div className="mb-2 px-3">
            <p className="truncate text-xs font-semibold text-foreground">{name}</p>
            <p className="truncate text-[11px] text-muted">{email}</p>
          </div>
          <button
            onClick={logout}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-foreground transition hover:bg-red-50 hover:text-red-700"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile topbar */}
      <div className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-xs font-black text-white">
              MF
            </span>
            <span className="text-sm font-bold text-brand-dark">Admin</span>
          </div>
          <button
            onClick={logout}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium"
          >
            Log out
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${
                isActive(link.href)
                  ? "bg-brand text-white"
                  : "text-foreground hover:bg-brand-soft"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
