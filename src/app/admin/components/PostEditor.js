"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MediaUploader from "./MediaUploader";
import {
  btnGhost,
  btnPrimary,
  card,
  cardPad,
  input,
  label,
  textarea,
} from "./ui";

/**
 * Create/edit form for a post: trilingual title/body, Temporary (7-day) vs
 * Permanent, draft/published/unpublished, and the media uploader.
 *
 * Saving goes through the protected /api/admin/posts routes, which re-check
 * the session, validate every field and invalidate the `posts` cache tag so
 * the public site refreshes immediately.
 */
export default function PostEditor({ post }) {
  const router = useRouter();
  const isNew = !post?._id;

  const [form, setForm] = useState({
    title: post?.title ?? "",
    titleMr: post?.titleMr ?? "",
    titleHi: post?.titleHi ?? "",
    body: post?.body ?? "",
    bodyMr: post?.bodyMr ?? "",
    bodyHi: post?.bodyHi ?? "",
    type: post?.type ?? "temporary",
    status: post?.status ?? "draft",
  });
  const [media, setMedia] = useState(post?.media ?? []);
  const [message, setMessage] = useState(null); // { kind, text }
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const payload = { ...form, media };
      const res = await fetch(
        isNew ? "/api/admin/posts" : `/api/admin/posts/${post._id}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({
          kind: "error",
          text: data.message || `Save failed (${res.status})`,
        });
        return;
      }
      setMessage({ kind: "ok", text: isNew ? "Post created." : "Post saved." });
      router.refresh();
      if (isNew && data.post?._id) {
        router.replace(`/admin/posts/${data.post._id}`);
      }
    } catch {
      setMessage({ kind: "error", text: "Network error — nothing was saved." });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (
      !window.confirm(
        "Delete this post permanently? Its photos/videos will also be removed from cloud storage."
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/posts/${post._id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage({ kind: "error", text: data.message || "Delete failed." });
        return;
      }
      router.push("/admin/posts");
      router.refresh();
    } catch {
      setMessage({ kind: "error", text: "Network error." });
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Status / type */}
      <section className={`${card} ${cardPad} space-y-4`}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <span className={label}>Lifetime</span>
            <div className="flex overflow-hidden rounded-lg border border-line">
              {["temporary", "permanent"].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("type", value)}
                  className={`flex-1 px-3 py-2 text-xs font-semibold transition ${
                    form.type === value
                      ? "bg-brand text-white"
                      : "bg-white text-foreground hover:bg-brand-soft"
                  }`}
                >
                  {value === "temporary" ? "Temporary (7 days)" : "Permanent"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={label} htmlFor="status">
              Status
            </label>
            <select
              id="status"
              className={input}
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>
          </div>

          <div className="flex items-end">
            <p className="text-[11px] leading-relaxed text-muted">
              Temporary posts get 7 days live from the moment you publish them;
              publishing an already-published post does not extend the clock.
            </p>
          </div>
        </div>
      </section>

      {/* Titles */}
      <section className={`${card} ${cardPad} space-y-4`}>
        <div>
          <label className={label} htmlFor="title">
            Title (English)
          </label>
          <input
            id="title"
            className={input}
            maxLength={200}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Fresh Rajapuri bananas arrived"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="titleMr">
              Title (Marathi)
            </label>
            <input
              id="titleMr"
              className={input}
              maxLength={200}
              value={form.titleMr}
              onChange={(e) => set("titleMr", e.target.value)}
              placeholder="ताजी राजापुरी केळी आली"
            />
          </div>
          <div>
            <label className={label} htmlFor="titleHi">
              Title (Hindi)
            </label>
            <input
              id="titleHi"
              className={input}
              maxLength={200}
              value={form.titleHi}
              onChange={(e) => set("titleHi", e.target.value)}
              placeholder="ताज़ा राजापुरी केले आए"
            />
          </div>
        </div>

        <div>
          <label className={label} htmlFor="body">
            Body (English)
          </label>
          <textarea
            id="body"
            className={textarea}
            maxLength={2000}
            value={form.body}
            onChange={(e) => set("body", e.target.value)}
            placeholder="Short description shown on the homepage and gallery…"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="bodyMr">
              Body (Marathi)
            </label>
            <textarea
              id="bodyMr"
              className={textarea}
              maxLength={2000}
              value={form.bodyMr}
              onChange={(e) => set("bodyMr", e.target.value)}
            />
          </div>
          <div>
            <label className={label} htmlFor="bodyHi">
              Body (Hindi)
            </label>
            <textarea
              id="bodyHi"
              className={textarea}
              maxLength={2000}
              value={form.bodyHi}
              onChange={(e) => set("bodyHi", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Media */}
      <section className={`${card} ${cardPad}`}>
        <MediaUploader
          media={media}
          onChange={setMedia}
          postId={post?._id}
          postIsSaved={Boolean(post?._id)}
        />
      </section>

      {/* Actions */}
      <section className={`${card} ${cardPad} space-y-3`}>
        {message && (
          <p
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              message.kind === "ok"
                ? "bg-brand-soft text-brand-dark"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={save} disabled={saving} className={btnPrimary}>
            {saving ? "Saving…" : isNew ? "Create post" : "Save changes"}
          </button>
          <Link href="/admin/posts" className={btnGhost}>
            Back to list
          </Link>
          {!isNew && (
            <button
              type="button"
              onClick={remove}
              disabled={deleting}
              className="ml-auto rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete post"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
