"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PlayIcon, CloseIcon, CameraIcon } from "./Icons";
import { formatDate } from "@/lib/localize";

/**
 * Gallery grid + lightbox for live post media (photos and videos).
 * Filters run client-side so the page stays prerendered.
 *
 * @param {Array<{id: string, kind: "image"|"video", url: string, thumb: string,
 *   title: string, publishedAt?: string, expiresAt?: string, badge?: string}>} items
 */
export default function GalleryClient({ items, locale, t }) {
  const [filter, setFilter] = useState("all");
  const [index, setIndex] = useState(null);

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.kind === filter)),
    [items, filter]
  );

  const close = useCallback(() => setIndex(null), []);
  const step = useCallback(
    (delta) =>
      setIndex((i) => (i === null ? i : (i + delta + visible.length) % visible.length)),
    [visible.length]
  );

  useEffect(() => {
    if (index === null) return undefined;
    function onKey(e) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, close, step]);

  const photoCount = items.filter((i) => i.kind === "image").length;
  const videoCount = items.filter((i) => i.kind === "video").length;
  const tabs = [
    { key: "all", label: t.gallery.all, count: items.length },
    { key: "image", label: t.gallery.photos, count: photoCount },
    { key: "video", label: t.gallery.videos, count: videoCount },
  ];

  const active = index === null ? null : visible[index];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {tabs.map((tab) => {
          const on = filter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setFilter(tab.key);
                setIndex(null);
              }}
              aria-pressed={on}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                on
                  ? "border-brand bg-brand text-white shadow-sm"
                  : "border-line bg-surface text-muted hover:border-brand/40 hover:text-brand-dark"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 text-xs ${
                  on ? "bg-white/20 text-white" : "bg-background text-muted"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIndex(i)}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-line bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Image
              src={item.thumb || item.url}
              alt={item.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
            {item.kind === "video" && (
              <span className="absolute inset-0 grid place-items-center bg-black/25">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-white/90 text-brand-dark">
                  <PlayIcon className="h-5 w-5" />
                </span>
              </span>
            )}
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-left text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
              {item.title}
            </span>
          </button>
        ))}
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
          onClick={close}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-4"
        >
          <div
            className="absolute right-4 top-4 flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white">
              {index + 1} / {visible.length}
            </span>
            <button
              type="button"
              onClick={close}
              aria-label={t.common.close}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <CloseIcon />
            </button>
          </div>

          <button
            type="button"
            aria-label="Previous"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20 sm:left-6"
          >
            ‹
          </button>

          <div
            className="flex max-h-[78vh] w-full max-w-5xl flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {active.kind === "video" ? (
              <video
                key={active.id}
                src={active.url}
                controls
                autoPlay
                playsInline
                className="max-h-[70vh] w-full rounded-2xl bg-black object-contain"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={active.url}
                alt={active.title}
                className="max-h-[70vh] w-auto max-w-full rounded-2xl object-contain"
              />
            )}
            <div className="mt-4 max-w-2xl text-center">
              <p className="text-base font-semibold text-white">{active.title}</p>
              <p className="mt-1 text-xs text-white/70">
                {formatDate(active.publishedAt, locale, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {active.expiresAt && (
                  <>
                    {" · "}
                    {t.gallery.expiresOn}{" "}
                    {formatDate(active.expiresAt, locale, {
                      day: "numeric",
                      month: "short",
                    })}
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Next"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20 sm:right-6"
          >
            ›
          </button>
        </div>
      )}

      {visible.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-14 text-center">
          <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand">
            <CameraIcon className="h-6 w-6" />
          </span>
          <p className="text-base font-semibold text-brand-dark">{t.gallery.empty}</p>
        </div>
      )}
    </div>
  );
}
