import type { Author } from "@/lib/types";

export function Avatar({ author, size = 36 }: { author: Author | null; size?: number }) {
  const name = author?.display_name ?? "?";
  if (author?.avatar_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={author.avatar_url} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
