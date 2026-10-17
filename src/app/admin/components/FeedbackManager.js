"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { card, statusPill } from "./ui";

/**
 * Feedback moderation list: approve / hide / mark spam / delete (confirmed).
 * Optimistic local updates, then router.refresh() to re-sync server data.
 */
export default function FeedbackManager({ initialItems }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [filter, setFilter] = useState("all"); // all | pending | approved | spam

  const shown = items.filter((item) => {
    if (filter === "pending") return !item.approved && !item.spam;
    if (filter === "approved") return item.approved && !item.spam;
    if (filter === "spam") return item.spam;
    return true;
  });

  async function patch(item, body) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item._id, ...body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ kind: "error", text: data.message || `Failed (${res.status})` });
        return;
      }
      setItems((prev) =>
        prev.map((row) => (row._id === item._id ? data.item : row))
      );
      router.refresh();
    } catch {
      setMessage({ kind: "error", text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  async function remove(item) {
    if (
      !window.confirm(
        `Delete the message from "${item.name}" permanently? This cannot be undone.`
      )
    ) {
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/feedback", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item._id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage({ kind: "error", text: data.message || "Delete failed." });
        return;
      }
      setItems((prev) => prev.filter((row) => row._id !== item._id));
      router.refresh();
    } catch {
      setMessage({ kind: "error", text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  const FILTERS = [
    ["all", "All"],
    ["pending", "Pending"],
    ["approved", "Approved"],
    ["spam", "Spam"],
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(([value, text]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === value
                ? "bg-brand text-white"
                : "border border-line bg-white text-foreground hover:bg-brand-soft"
            }`}
          >
            {text}
          </button>
        ))}
      </div>

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

      {shown.length === 0 ? (
        <div className={`${card} p-8 text-center text-sm text-muted`}>
          Nothing here.
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((item) => (
            <li key={item._id} className={`${card} p-4 sm:p-5`}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {item.name}
                </span>
                {item.contact && (
                  <span className="text-xs text-muted">{item.contact}</span>
                )}
                <span className="text-[11px] uppercase text-muted">
                  {item.language}
                </span>
                {item.rating && (
                  <span className="text-xs text-accent">
                    {"★".repeat(item.rating)}
                    {"☆".repeat(5 - item.rating)}
                  </span>
                )}
                <span
                  className={
                    item.spam
                      ? statusPill.spam
                      : item.approved
                        ? statusPill.approved
                        : statusPill.pending
                  }
                >
                  {item.spam ? "spam" : item.approved ? "approved" : "pending"}
                </span>
                <span className="ml-auto text-[11px] text-muted">
                  {new Date(item.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              <p className="whitespace-pre-wrap text-sm text-foreground">
                {item.message}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => patch(item, { approved: !item.approved })}
                  className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium hover:bg-brand-soft"
                >
                  {item.approved ? "Hide" : "Approve"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => patch(item, { spam: !item.spam })}
                  className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium hover:bg-brand-soft"
                >
                  {item.spam ? "Not spam" : "Mark spam"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(item)}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
