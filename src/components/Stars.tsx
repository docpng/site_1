export function Stars({ rating, size = "h-4 w-4" }: { rating: number; size?: string }) {
  return (
    <span className="inline-flex items-center" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className={`${size} ${i <= Math.round(rating) ? "text-brand-500" : "text-slate-200"}`} fill="currentColor" aria-hidden>
          <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}
