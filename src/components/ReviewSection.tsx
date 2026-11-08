import Link from "next/link";
import { deleteReview } from "@/app/actions/community";
import { getCurrentUser } from "@/lib/auth";
import { text } from "@/lib/content";
import { getSettings, listReviews } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { Avatar } from "./Avatar";
import { ReviewForm } from "./ReviewForm";
import { Stars } from "./Stars";

export async function ReviewSection({ productId, slug }: { productId: string; slug: string }) {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  const reviews = await listReviews(productId, user && { id: user.id, isAdmin: user.profile.is_admin });
  const visible = reviews.filter((r) => !r.hidden);
  const mine = user ? reviews.find((r) => r.user_id === user.id) : undefined;
  const avg = visible.length ? visible.reduce((n, r) => n + r.rating, 0) / visible.length : 0;

  return (
    <section className="mt-16 border-t border-line pt-10" id="reviews">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold">{text(settings, "reviews_title")}</h2>
        {visible.length > 0 && (
          <span className="flex items-center gap-2 text-sm text-muted">
            <Stars rating={avg} /> {avg.toFixed(1)} · {visible.length} review{visible.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_380px]">
        <ul className="space-y-6">
          {visible.length === 0 && <li className="text-sm text-muted">{text(settings, "reviews_empty")}</li>}
          {visible.map((r) => (
            <li key={r.id} className="flex gap-3">
              <Avatar author={r.author} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold">{r.author?.display_name ?? "Someone"}</span>
                  {r.verified && <span className="badge">Verified purchase</span>}
                  <span className="text-muted">{formatDate(r.created_at)}</span>
                  {user && (user.id === r.user_id || user.profile?.is_admin) && (
                    <form action={deleteReview} className="ml-auto">
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="slug" value={slug} />
                      <button className="text-xs text-muted hover:text-red-600">Delete</button>
                    </form>
                  )}
                </div>
                <div className="mt-1">
                  <Stars rating={r.rating} />
                </div>
                {r.title && <p className="mt-2 font-medium">{r.title}</p>}
                {r.body && <p className="mt-1 text-sm whitespace-pre-wrap text-slate-700">{r.body}</p>}
              </div>
            </li>
          ))}
        </ul>

        <div>
          {user ? (
            <>
              <h3 className="mb-3 font-semibold">{mine ? "Your review" : "Write a review"}</h3>
              <ReviewForm productId={productId} slug={slug} existing={mine} />
            </>
          ) : (
            <Link
              href={`/login?next=${encodeURIComponent(`/shop/${slug}#reviews`)}`}
              className="block rounded-xl bg-brand-50 p-5 text-sm font-medium text-brand-700 hover:bg-brand-100"
            >
              {text(settings, "reviews_signin")}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
