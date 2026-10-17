import Image from "next/image";
import WhatsAppButton from "./WhatsAppButton";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { localizedField, formatDate } from "@/lib/localize";
import { mediaUrl, thumbnailUrl, isVideo } from "@/lib/media";
import { CameraIcon } from "./Icons";

/**
 * One published post: optional photo/video + title + short body.
 * Temporary posts show their expiry date; expired ones never reach here
 * (the content layer filters them out).
 */
export default function PostCard({ post, locale, t, aspect = "video" }) {
  const title = localizedField(post, locale, "title");
  const body = localizedField(post, locale, "body");
  const media = post.media?.[0];
  const hasMedia = Boolean(media);
  const video = hasMedia && isVideo(media);

  const badge =
    post.type === "temporary"
      ? { label: t.gallery.temporary, className: "bg-accent text-brand-dark" }
      : { label: t.gallery.permanent, className: "bg-brand-soft text-brand-dark" };

  const message = [t.whatsapp.stockEnquiry, `— ${title}`].join("\n");
  const ratio = aspect === "wide" ? "aspect-[16/9]" : "aspect-[4/3]";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {hasMedia ? (
        <div className={`relative w-full overflow-hidden bg-brand-soft ${ratio}`}>
          {video ? (
            <video
              src={mediaUrl(media)}
              controls
              preload="metadata"
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <Image
              src={thumbnailUrl(media)}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          )}
        </div>
      ) : (
        <div className="relative flex items-center gap-3 bg-brand-soft px-5 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface text-brand">
            <CameraIcon className="h-5 w-5" />
          </span>
          <span className="text-xs font-medium text-brand-dark">
            {t.gallery.noMedia}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
          <span className={`rounded-full px-2.5 py-1 font-semibold ${badge.className}`}>
            {badge.label}
          </span>
          {post.publishedAt && (
            <span className="text-muted">
              {formatDate(post.publishedAt, locale, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
          {post.type === "temporary" && post.expiresAt && (
            <span className="text-muted">
              · {t.gallery.expiresOn}{" "}
              {formatDate(post.expiresAt, locale, { day: "numeric", month: "short" })}
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold leading-snug text-brand-dark">{title}</h3>
        {body && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{body}</p>
        )}

        <div className="mt-auto pt-4">
          <WhatsAppButton
            href={buildWhatsAppLink(message)}
            label={t.gallery.enquiry}
            size="sm"
            variant="outline"
          />
        </div>
      </div>
    </article>
  );
}
