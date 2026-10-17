import Link from "next/link";
import { getAdminOverview } from "@/lib/admin-data";
import { card, cardPad, pageH1, statusPill } from "../components/ui";
import { formatDate } from "@/lib/localize";

export const metadata = { title: "Dashboard" };

function Stat({ label, value, hint, tone = "default" }) {
  const tones = {
    default: "text-brand-dark",
    warn: "text-amber-700",
    good: "text-brand",
  };
  return (
    <div className={`${card} ${cardPad}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className={`mt-1 text-3xl font-bold ${tones[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const { counts, recentPosts, recentFeedback } = await getAdminOverview();

  return (
    <div className="space-y-6">
      <div>
        <h1 className={pageH1}>Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Content, stock and feedback at a glance.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Published posts"
          value={counts.postsPublished}
          hint={`${counts.postsDraft} draft${counts.postsDraft === 1 ? "" : "s"} · ${counts.postsTotal} total`}
        />
        <Stat
          label="Expiring ≤ 2 days"
          value={counts.postsExpiringSoon}
          hint="Temporary posts to review"
          tone={counts.postsExpiringSoon > 0 ? "warn" : "default"}
        />
        <Stat
          label="Available lots"
          value={counts.stockAvailable}
          hint={`${counts.stockLots} lots on record`}
          tone="good"
        />
        <Stat
          label="Pending feedback"
          value={counts.feedbackPending}
          hint={`${counts.feedbackApproved} approved · ${counts.feedbackSpam} spam`}
          tone={counts.feedbackPending > 0 ? "warn" : "default"}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className={card}>
          <div className="flex items-center justify-between border-b border-line px-5 pb-4 pt-5">
            <h2 className="font-bold text-brand-dark">Recent posts</h2>
            <Link href="/admin/posts" className="text-xs font-semibold text-brand hover:underline">
              Manage →
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {recentPosts.length === 0 && (
              <li className="px-5 py-4 text-sm text-muted">No posts yet.</li>
            )}
            {recentPosts.map((post) => (
              <li key={post._id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{post.title}</p>
                  <p className="text-[11px] text-muted">
                    {post.publishedAt
                      ? `Published ${formatDate(post.publishedAt, "en", { day: "numeric", month: "short", year: "numeric" })}`
                      : "Never published"}
                  </p>
                </div>
                <span className={statusPill[post.status] || statusPill.draft}>
                  {post.status}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={card}>
          <div className="flex items-center justify-between border-b border-line px-5 pb-4 pt-5">
            <h2 className="font-bold text-brand-dark">Feedback awaiting review</h2>
            <Link href="/admin/feedback" className="text-xs font-semibold text-brand hover:underline">
              Review →
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {recentFeedback.length === 0 && (
              <li className="px-5 py-4 text-sm text-muted">Nothing waiting. 🎉</li>
            )}
            {recentFeedback.map((item) => (
              <li key={item._id} className="px-5 py-3">
                <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                <p className="line-clamp-2 text-xs text-muted">{item.message}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`${card} ${cardPad} flex flex-wrap gap-3`}>
        <Link href="/admin/posts/new" className="text-sm font-semibold text-brand hover:underline">
          + New post
        </Link>
        <Link href="/admin/stock" className="text-sm font-semibold text-brand hover:underline">
          + Update stock
        </Link>
        <Link href="/admin/feedback" className="text-sm font-semibold text-brand hover:underline">
          Review feedback
        </Link>
        <span className="text-xs text-muted">
          Prices are never shown publicly — buyers ask on WhatsApp.
        </span>
      </section>
    </div>
  );
}
