/** Section header used across the public pages. */
export default function SectionHeading({ eyebrow, title, subtitle, action }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">
          {title}
        </h2>
        {subtitle && <p className="mt-2 max-w-xl text-sm text-muted sm:text-base">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
