"use client";

import { useActionState, useState } from "react";
import { saveReview, type FormState } from "@/app/actions/community";
import { SubmitButton } from "./SubmitButton";

export function ReviewForm({ productId, slug, existing }: {
  productId: string;
  slug: string;
  existing?: { rating: number; title: string; body: string };
}) {
  const [state, action] = useActionState<FormState, FormData>(saveReview, undefined);
  const [rating, setRating] = useState(existing?.rating ?? 0);

  return (
    <form action={action} className="card space-y-4 p-5">
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="rating" value={rating} />
      <div>
        <span className="label">Your rating</span>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={rating === i}
              aria-label={`${i} star${i > 1 ? "s" : ""}`}
              onClick={() => setRating(i)}
              className={`text-2xl leading-none ${i <= rating ? "text-brand-500" : "text-slate-300 hover:text-brand-300"}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="review-title">Headline</label>
        <input id="review-title" name="title" maxLength={120} defaultValue={existing?.title} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="review-body">Review</label>
        <textarea id="review-body" name="body" rows={4} maxLength={5000} defaultValue={existing?.body} className="input" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-brand-700">Thanks! Your review is saved.</p>}
      <SubmitButton>{existing ? "Update review" : "Submit review"}</SubmitButton>
    </form>
  );
}
