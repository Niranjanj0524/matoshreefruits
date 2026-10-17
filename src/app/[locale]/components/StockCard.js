import WhatsAppButton from "./WhatsAppButton";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { localizedField, formatDate } from "@/lib/localize";
import { BoxIcon } from "./Icons";

/**
 * One stock lot. Shows quantity, quality, location and availability —
 * deliberately NO price: enquiries always go through WhatsApp.
 */
export default function StockCard({ item, locale, t, compact = false }) {
  const variety = localizedField(item, locale, "variety");
  const notes = localizedField(item, locale, "notes");
  const unit = t.stock.units[item.unit] || item.unit;
  const grade = t.stock.qualities[item.quality] || item.quality;

  const message = [
    t.whatsapp.greeting,
    `— ${variety}`,
    `${t.stock.fields.quantity}: ${item.quantity} ${unit}`,
    `${t.stock.fields.quality}: ${grade}`,
    `${t.stock.fields.location}: ${item.location}`,
  ].join("\n");

  const available = item.available !== false;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-brand-dark">
            <BoxIcon className="h-5 w-5" />
          </span>
          <h3 className="text-base font-bold leading-tight text-brand-dark sm:text-lg">
            {variety}
          </h3>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            available ? "bg-brand-soft text-brand-dark" : "bg-muted/10 text-muted"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${available ? "bg-brand" : "bg-muted"}`}
          />
          {available ? t.common.available : t.common.unavailable}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-background p-3">
          <dt className="text-xs uppercase tracking-wide text-muted">
            {t.stock.fields.quantity}
          </dt>
          <dd className="mt-1 font-semibold text-foreground">
            {item.quantity} <span className="font-normal text-muted">{unit}</span>
          </dd>
        </div>
        <div className="rounded-xl bg-background p-3">
          <dt className="text-xs uppercase tracking-wide text-muted">
            {t.stock.fields.quality}
          </dt>
          <dd className="mt-1 font-semibold text-foreground">{grade}</dd>
        </div>
        <div className="col-span-2 rounded-xl bg-background p-3">
          <dt className="text-xs uppercase tracking-wide text-muted">
            {t.stock.fields.location}
          </dt>
          <dd className="mt-1 font-semibold text-foreground">{item.location}</dd>
        </div>
      </dl>

      {notes && !compact && (
        <p className="mt-3 text-sm italic leading-relaxed text-muted">{notes}</p>
      )}

      <div className="mt-auto flex flex-col gap-3 pt-4">
        <p className="text-[11px] text-muted">
          {t.stock.fields.updated}:{" "}
          {formatDate(item.updatedAt || item.createdAt, locale)}
        </p>
        <WhatsAppButton
          href={buildWhatsAppLink(message)}
          label={t.common.whatsappEnquiry}
          size="sm"
          className="w-full"
        />
      </div>
    </article>
  );
}
