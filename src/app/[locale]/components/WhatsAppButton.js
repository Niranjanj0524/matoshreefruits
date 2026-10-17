import { WhatsAppIcon } from "./Icons";

const SIZES = {
  sm: "px-3.5 py-2 text-xs gap-1.5",
  md: "px-5 py-2.5 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2",
};

const VARIANTS = {
  primary: "bg-brand text-white hover:bg-brand-dark shadow-sm",
  accent: "bg-accent text-brand-dark hover:brightness-105 shadow-sm",
  outline: "border border-brand/40 bg-surface text-brand-dark hover:bg-brand-soft",
  light: "bg-white text-brand-dark hover:bg-accent-soft shadow-sm",
  ghost: "bg-transparent text-brand-dark hover:bg-brand-soft",
};

/** WhatsApp enquiry CTA — opens wa.me in a new tab. Never contains pricing. */
export default function WhatsAppButton({
  href,
  label,
  size = "md",
  variant = "primary",
  className = "",
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center rounded-full font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
    >
      <WhatsAppIcon className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} />
      <span>{label}</span>
    </a>
  );
}
