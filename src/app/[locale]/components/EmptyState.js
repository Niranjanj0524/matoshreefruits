/** Friendly placeholder when a list has no content yet. */
export default function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-14 text-center">
      {Icon && (
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Icon className="h-6 w-6" />
        </span>
      )}
      <p className="text-base font-semibold text-brand-dark">{title}</p>
      {text && <p className="mx-auto mt-2 max-w-md text-sm text-muted">{text}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
