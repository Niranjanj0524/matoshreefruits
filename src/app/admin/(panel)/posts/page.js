import Link from "next/link";
import { getPostsAdmin } from "@/lib/admin-data";
import { btnPrimary, card, pageH1, statusPill } from "../../components/ui";
import { formatDate } from "@/lib/localize";
import PostRowActions from "../../components/PostRowActions";

export const metadata = { title: "Posts & media" };

export default async function AdminPostsPage() {
  const posts = await getPostsAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={pageH1}>Posts & media</h1>
          <p className="mt-1 text-sm text-muted">
            Photos/videos the public site shows. Temporary posts expire 7 days after publishing.
          </p>
        </div>
        <Link href="/admin/posts/new" className={btnPrimary}>
          + New post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className={`${card} p-8 text-center text-sm text-muted`}>
          No posts yet. Create the first photo/video update.
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => {
            const expired =
              post.type === "temporary" &&
              post.expiresAt &&
              new Date(post.expiresAt) < new Date();
            return (
              <li key={post._id} className={`${card} p-4 sm:p-5`}>
                <div className="flex flex-wrap items-start gap-4">
                  {/* Media thumbnail */}
                  <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-brand-soft">
                    {post.media?.[0] ? (
                      post.media[0].resourceType === "video" ? (
                        <video
                          src={post.media[0].secureUrl || post.media[0].url}
                          muted
                          preload="metadata"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.media[0].secureUrl || post.media[0].url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )
                    ) : (
                      <div className="grid h-full w-full place-items-center text-xs text-muted">
                        no media
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className={statusPill[post.status] || statusPill.draft}>
                        {post.status}
                      </span>
                      <span className={statusPill[post.type]}>
                        {post.type === "temporary" ? "7-day" : "permanent"}
                      </span>
                      {post.media?.length > 0 && (
                        <span className="text-[11px] text-muted">
                          {post.media.length} file{post.media.length === 1 ? "" : "s"}
                        </span>
                      )}
                      {expired && (
                        <span className="text-[11px] font-semibold text-red-600">
                          expired {formatDate(post.expiresAt, "en")}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-foreground">{post.title}</p>
                    <p className="text-xs text-muted">
                      {post.publishedAt
                        ? `Published ${formatDate(post.publishedAt, "en", { day: "numeric", month: "short", year: "numeric" })}`
                        : "Not published yet"}
                      {post.type === "temporary" && post.expiresAt && !expired
                        ? ` · expires ${formatDate(post.expiresAt, "en", { day: "numeric", month: "short", year: "numeric" })}`
                        : ""}
                    </p>
                  </div>

                  <PostRowActions id={post._id} status={post.status} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
