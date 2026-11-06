"use client";

import { useActionState, useEffect, useRef } from "react";
import { addComment, type FormState } from "@/app/actions/community";
import { SubmitButton } from "./SubmitButton";

export function CommentForm({ postId, slug, parentId, placeholder = "Join the discussion…" }: {
  postId: string;
  slug: string;
  parentId?: string;
  placeholder?: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(addComment, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="post_id" value={postId} />
      <input type="hidden" name="slug" value={slug} />
      {parentId && <input type="hidden" name="parent_id" value={parentId} />}
      <textarea name="body" required maxLength={5000} rows={parentId ? 2 : 4} placeholder={placeholder} className="input" />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton pendingText="Posting…">{parentId ? "Reply" : "Post comment"}</SubmitButton>
    </form>
  );
}
