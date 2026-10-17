"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { btnDanger, btnGhost } from "./ui";

/**
 * Row actions in the posts list: publish / unpublish / edit / delete.
 * Deleting always asks for confirmation and warns that cloud media goes too.
 */
export default function PostRowActions({ id, status }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function call(method, body, confirmMessage) {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || `Request failed (${res.status})`);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/posts/${id}`}
          className={`${btnGhost} !px-3 !py-1.5 !text-xs`}
        >
          Edit
        </Link>
        {status === "published" ? (
          <button
            disabled={busy}
            onClick={() => call("PATCH", { status: "unpublished" })}
            className={`${btnGhost} !px-3 !py-1.5 !text-xs`}
          >
            Unpublish
          </button>
        ) : (
          <button
            disabled={busy}
            onClick={() => call("PATCH", { status: "published" })}
            className={`${btnGhost} !px-3 !py-1.5 !text-xs`}
          >
            Publish
          </button>
        )}
        <button
          disabled={busy}
          onClick={() =>
            call(
              "DELETE",
              null,
              "Delete this post permanently? Its photos/videos will also be removed from cloud storage."
            )
          }
          className={`${btnDanger} !px-3 !py-1.5 !text-xs`}
        >
          Delete
        </button>
      </div>
      {error && <p className="text-[11px] font-medium text-red-600">{error}</p>}
    </div>
  );
}
