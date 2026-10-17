import { StarIcon } from "./Icons";

/** 1–5 rating stars (empty when rating is missing). */
export default function Stars({ rating, className = "h-4 w-4" }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-0.5 text-accent" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} className={className} filled={n <= rating} />
      ))}
    </div>
  );
}
