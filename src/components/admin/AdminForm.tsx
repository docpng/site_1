"use client";

import { useActionState } from "react";
import type { AdminFormState } from "@/app/actions/admin";
import { SubmitButton } from "../SubmitButton";

type Action = (prev: AdminFormState, fd: FormData) => Promise<AdminFormState>;

/** Wraps an admin editor: shows save errors / confirmations and a sticky save bar. */
export function AdminForm({ action, children, savedInitially = false, submitLabel = "Save" }: {
  action: Action;
  children: React.ReactNode;
  savedInitially?: boolean;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState<AdminFormState, FormData>(action, savedInitially ? { ok: true } : undefined);
  return (
    <form action={formAction} className="space-y-6">
      {children}
      <div className="sticky bottom-0 -mx-6 flex items-center gap-4 border-t border-line bg-white/95 px-6 py-4 backdrop-blur">
        <SubmitButton>{submitLabel}</SubmitButton>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.ok && <p className="text-sm text-brand-700">Saved ✓</p>}
      </div>
    </form>
  );
}

export function Field({ label, name, defaultValue, help, ...rest }: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  help?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "name">) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input id={name} name={name} defaultValue={defaultValue ?? ""} className="input" {...rest} />
      {help && <p className="mt-1 text-xs text-muted">{help}</p>}
    </div>
  );
}

export function TextArea({ label, name, defaultValue, rows = 3, help }: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  help?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <textarea id={name} name={name} defaultValue={defaultValue ?? ""} rows={rows} className="input" />
      {help && <p className="mt-1 text-xs text-muted">{help}</p>}
    </div>
  );
}

export function Toggle({ label, name, defaultChecked, help }: { label: string; name: string; defaultChecked?: boolean; help?: string }) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-line p-3">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 accent-brand-600" />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {help && <span className="block text-xs text-muted">{help}</span>}
      </span>
    </label>
  );
}
