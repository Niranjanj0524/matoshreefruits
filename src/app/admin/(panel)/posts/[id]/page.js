import { notFound } from "next/navigation";
import { getPostAdmin } from "@/lib/admin-data";
import PostEditor from "../../../components/PostEditor";

export const metadata = { title: "Edit post" };

export default async function EditPostPage({ params }) {
  const { id } = await params;
  const post = await getPostAdmin(id);
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">
          Edit post
        </h1>
        <p className="mt-1 text-sm text-muted">
          Changes appear on the public site as soon as you save.
        </p>
      </div>
      <PostEditor post={post} />
    </div>
  );
}
