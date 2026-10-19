import SetupForm from "../components/SetupForm";

export const metadata = { title: "Set up admin" };

/**
 * Public one-time setup page (outside the (panel) group, so no session needed).
 *
 * It lets the operator create the FIRST admin against an empty database (e.g.
 * a fresh Atlas) from the browser, instead of needing shell access to run
 * `npm run create-admin`. It only works while no admin exists — once one is
 * created this page reports "already set up" and links to sign-in, and the API
 * refuses further signups. The proxy allows this path without a session.
 */
export default function AdminSetupPage() {
  return <SetupForm />;
}
