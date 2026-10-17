import { getFeedbackAdmin } from "@/lib/admin-data";
import { pageH1 } from "../../components/ui";
import FeedbackManager from "../../components/FeedbackManager";

export const metadata = { title: "Feedback" };

/** Approve, hide, spam-flag or delete messages from the public form. */
export default async function AdminFeedbackPage() {
  const items = await getFeedbackAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className={pageH1}>Feedback</h1>
        <p className="mt-1 text-sm text-muted">
          Only approved messages appear on the public feedback wall.
        </p>
      </div>
      <FeedbackManager initialItems={items} />
    </div>
  );
}
