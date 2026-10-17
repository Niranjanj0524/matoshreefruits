"use client";

import { useMemo, useState } from "react";
import StockCard from "./StockCard";

/**
 * Client-side stock browser: availability filter on top of the server-rendered
 * lot list (keeps the page in the static shell — no searchParams needed).
 */
export default function StockBrowser({ items, locale, t }) {
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const availableCount = useMemo(
    () => items.filter((i) => i.available !== false).length,
    [items]
  );
  const visible = useMemo(
    () => (onlyAvailable ? items.filter((i) => i.available !== false) : items),
    [items, onlyAvailable]
  );

  const filters = [
    { key: false, label: t.stock.filterAll, count: items.length },
    { key: true, label: t.stock.filterAvailable, count: availableCount },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {filters.map((f) => {
          const active = onlyAvailable === f.key;
          return (
            <button
              key={String(f.key)}
              type="button"
              onClick={() => setOnlyAvailable(f.key)}
              aria-pressed={active}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                active
                  ? "border-brand bg-brand text-white shadow-sm"
                  : "border-line bg-surface text-muted hover:border-brand/40 hover:text-brand-dark"
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-1.5 text-xs ${
                  active ? "bg-white/20 text-white" : "bg-background text-muted"
                }`}
              >
                {f.count}
              </span>
            </button>
          );
        })}
        <span className="ml-auto text-sm text-muted">
          {visible.length} {t.stock.results}
        </span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) => (
          <StockCard key={item._id} item={item} locale={locale} t={t} />
        ))}
      </div>
    </div>
  );
}
