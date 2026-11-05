"use client";

import { useActionState } from "react";
import { updateDisplayName, type FormState } from "@/app/actions/community";
import { SubmitButton } from "@/components/SubmitButton";

export function NameForm({ name }: { name: string }) {
  const [state, action] = useActionState<FormState, FormData>(updateDisplayName, undefined);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="min-w-60 flex-1">
        <label className="label" htmlFor="display_name">
          Display name (shown on comments and reviews)
        </label>
        <input id="display_name" name="display_name" defaultValue={name} maxLength={60} required className="input" />
      </div>
      <SubmitButton>Save</SubmitButton>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="w-full text-sm text-brand-700">Saved.</p>}
    </form>
  );
}
