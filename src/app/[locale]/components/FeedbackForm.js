"use client";

import { useState } from "react";

const EMPTY = { name: "", contact: "", message: "", website: "" };

/**
 * Public feedback form → POST /api/feedback.
 * Includes a honeypot field ("website") that humans never fill in; the API
 * silently accepts those and discards them.
 */
export default function FeedbackForm({ locale, t }) {
  const f = t.feedback.form;
  const [values, setValues] = useState(EMPTY);
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [error, setError] = useState("");

  function update(field) {
    return (e) => setValues((v) => ({ ...v, [field]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (status === "sending") return;

    if (!values.name.trim() || !values.message.trim()) {
      setStatus("error");
      setError(f.required);
      return;
    }

    setStatus("sending");
    setError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          contact: values.contact.trim(),
          message: values.message.trim(),
          rating: rating || null,
          language: locale,
          website: values.website,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        const byCode = { rate_limited: f.tooMany, invalid: f.required };
        throw new Error(byCode[data.code] || f.error);
      }

      setStatus("success");
      setValues(EMPTY);
      setRating(0);
    } catch (err) {
      setStatus("error");
      setError(err.message || f.error);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-line bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted/70 transition focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="fb-name" className="mb-1.5 block text-sm font-medium text-foreground">
          {f.name} <span className="text-brand">*</span>
        </label>
        <input
          id="fb-name"
          name="name"
          type="text"
          autoComplete="name"
          value={values.name}
          onChange={update("name")}
          placeholder={f.namePlaceholder}
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="fb-contact"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          {f.contact}
        </label>
        <input
          id="fb-contact"
          name="contact"
          type="text"
          autoComplete="tel"
          value={values.contact}
          onChange={update("contact")}
          placeholder={f.contactPlaceholder}
          className={inputClass}
        />
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-foreground">
          {f.rating} <span className="text-xs font-normal text-muted">({f.ratingHint})</span>
        </span>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating((r) => (r === n ? 0 : n))}
              aria-label={`${n} — ${f.ratingLabels[n - 1]}`}
              aria-pressed={rating >= n}
              className={`grid h-9 w-9 place-items-center rounded-lg border text-lg transition ${
                rating >= n
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line bg-background text-muted/50 hover:text-accent"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="fb-message"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          {f.message} <span className="text-brand">*</span>
        </label>
        <textarea
          id="fb-message"
          name="message"
          rows={5}
          value={values.message}
          onChange={update("message")}
          placeholder={f.messagePlaceholder}
          className={`${inputClass} resize-y`}
        />
      </div>

      {/* Honeypot — hidden from people, tempting for bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="fb-website">Website</label>
        <input
          id="fb-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={update("website")}
        />
      </div>

      {status === "error" && error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {status === "success" ? (
        <div
          role="status"
          className="rounded-xl border border-brand/25 bg-brand-soft px-4 py-4"
        >
          <p className="text-sm font-semibold text-brand-dark">{f.success}</p>
          <p className="mt-1 text-xs text-muted">{f.successNote}</p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="mt-3 text-xs font-semibold text-brand underline underline-offset-2"
          >
            {f.submit}
          </button>
        </div>
      ) : (
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        >
          {status === "sending" ? f.submitting : f.submit}
        </button>
      )}
    </form>
  );
}
