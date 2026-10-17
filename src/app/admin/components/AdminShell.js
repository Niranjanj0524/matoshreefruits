import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getSession } from "@/lib/session";
import AdminNav from "./AdminNav";

/**
 * Authenticated shell: verifies the signed session cookie server-side and
 * renders the sidebar + topbar around the page content. Any page under
 * (panel) is therefore only reachable with a valid session — and every admin
 * API re-checks it independently (defence in depth).
 *
 * `connection()` first: the session check reads the cookie and the clock
 * (`Date.now()` in verifySession), which must happen at request time, never
 * during a prerender pass.
 */
export default async function AdminShell({ children }) {
  await connection();
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-screen lg:flex">
      <AdminNav name={session.name} email={session.email} />
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
