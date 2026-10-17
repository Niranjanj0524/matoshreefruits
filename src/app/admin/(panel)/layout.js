import { Suspense } from "react";
import AdminShell from "../components/AdminShell";

/**
 * Guarded admin area. With Cache Components the session read must sit behind a
 * <Suspense> boundary, so the shell below (sidebar, topbar) streams in per
 * request while the static parts of each page stay instant. `instant = false`
 * opts the segment out of instant-navigation validation: a login gate is
 * allowed to block the navigation.
 */
export const instant = false;

export default function PanelLayout({ children }) {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center text-sm text-muted">
          Loading admin…
        </div>
      }
    >
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
