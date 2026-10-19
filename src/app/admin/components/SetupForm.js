"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { btnPrimary, card, cardPad, input, label } from "./ui";

/**
 * One-time admin setup form. Creates the FIRST admin via /api/admin/setup,
 * which only succeeds while no admin exists (then locks itself).
 *
 * States handled:
 *  - already configured  → show "go sign in" instead of the form
 *  - optional setup secret required (ADMIN_SETUP_SECRET set) → extra field
 *  - success → the API sets the session cookie; jump straight to the dashboard
 */
export default function SetupForm() {
  const router = useRouter();
  const [configured, setConfigured] = useState(null); // null = loading
  const [secretRequired, setSecretRequired] = useState(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/setup")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.ok) return;
        setConfigured(Boolean(data.configured));
        setSecretRequired(Boolean(data.secretRequired));
      })
      .catch(() => !cancelled && setConfigured(false));
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, secret }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data.code === "already_configured"
            ? "An admin already exists. Go to sign in instead."
            : data.code === "bad_secret"
              ? "Incorrect setup key."
              : data.code === "weak_password"
                ? "Password must be at least 8 characters."
                : data.code === "invalid_email"
                  ? "Enter a valid email address."
                  : data.code === "rate_limited"
                    ? "Too many attempts. Wait 10 minutes and try again."
                    : "Something went wrong. Please try again."
        );
        setPending(false);
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setPending(false);
    }
  }

  // Loading: render a neutral shell.
  if (configured === null) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-muted">Checking setup status…</p>
      </div>
    );
  }

  // Already configured: point the operator to sign-in, expose nothing else.
  if (configured) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className={`w-full max-w-sm ${card} ${cardPad} text-center`}>
          <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-brand text-lg font-black text-white">
            MF
          </div>
          <h1 className="text-xl font-bold text-brand-dark">Already set up</h1>
          <p className="mt-2 text-sm text-muted">
            An admin account already exists, so setup is disabled. Sign in with
            your existing credentials.
          </p>
          <Link href="/admin/login" className={`${btnPrimary} mt-5 w-full`}>
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className={`w-full max-w-sm ${card} ${cardPad}`}>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-brand text-lg font-black text-white">
            MF
          </div>
          <h1 className="text-xl font-bold text-brand-dark">Set up admin</h1>
          <p className="mt-1 text-sm text-muted">
            Create the first admin account. This page disables itself afterward.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className={label} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              className={input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@matoshreefruits.com"
            />
          </div>

          <div>
            <label className={label} htmlFor="name">
              Name (optional)
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              className={input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Administrator"
            />
          </div>

          <div>
            <label className={label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className={input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          {secretRequired && (
            <div>
              <label className={label} htmlFor="secret">
                Setup key
              </label>
              <input
                id="secret"
                type="password"
                required
                autoComplete="off"
                className={input}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="ADMIN_SETUP_SECRET value"
              />
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>
            {pending ? "Creating…" : "Create admin & sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted">
          Already have an account?{" "}
          <Link href="/admin/login" className="font-semibold text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
