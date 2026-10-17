/** Shared class strings for the admin area — keeps every screen consistent. */

export const card = "rounded-2xl border border-line bg-surface shadow-sm";
export const cardPad = "p-5 sm:p-6";

export const label =
  "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted";

export const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-background";

export const textarea = `${input} min-h-24 resize-y`;

export const select = `${input} appearance-none pr-8`;

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-50";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-foreground transition hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50";

export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50";

export const pageH1 =
  "text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl";

export const pill = "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold";

export const statusPill = {
  published: `${pill} bg-brand-soft text-brand-dark`,
  draft: `${pill} bg-accent-soft text-amber-800`,
  unpublished: `${pill} bg-gray-100 text-gray-600`,
  temporary: `${pill} bg-accent text-brand-dark`,
  permanent: `${pill} bg-brand-soft text-brand-dark`,
  available: `${pill} bg-brand-soft text-brand-dark`,
  unavailable: `${pill} bg-gray-100 text-gray-500`,
  pending: `${pill} bg-accent-soft text-amber-800`,
  approved: `${pill} bg-brand-soft text-brand-dark`,
  spam: `${pill} bg-red-100 text-red-700`,
};
