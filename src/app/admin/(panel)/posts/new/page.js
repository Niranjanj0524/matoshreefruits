import PostEditor from "../../../components/PostEditor";

export const metadata = { title: "New post" };

/** Create a post (draft by default). */
export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">
          New post
        </h1>
        <p className="mt-1 text-sm text-muted">
          Add photos/videos and pick Temporary (7 days) or Permanent.
        </p>
      </div>
      <PostEditor />
    </div>
  );
}
