"use client";

/**
 * Route error boundary. Deliberately trilingual — it renders outside the
 * localized message tree, so all three languages are shown together.
 */
export default function Error({ error, reset }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-2xl">
        🍌
      </span>
      <h1 className="mt-5 text-2xl font-bold text-brand-dark">
        काहीतरी चूक झाली · कुछ गड़बड़ हुई · Something went wrong
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        मजकूर लोड होऊ शकला नाही · कंटेंट लोड नहीं हो सका · We could not load this
        content. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-7 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
      >
        पुन्हा प्रयत्न करा · फिर से प्रयास करें · Try again
      </button>
    </div>
  );
}
