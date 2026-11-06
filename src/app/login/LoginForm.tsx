"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next, error }: { next: string; error?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [message, setMessage] = useState<string | null>(error ?? null);

  const callbackUrl = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setMessage(null);
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl() },
    });
    if (error) {
      setStatus("idle");
      setMessage(error.message);
    } else {
      setStatus("sent");
    }
  };

  const oauth = async (provider: "google" | "github") => {
    setMessage(null);
    const { error } = await createClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl() },
    });
    if (error) setMessage(error.message);
  };

  if (status === "sent") {
    return (
      <div className="rounded-xl bg-brand-50 p-6 text-center">
        <p className="font-medium">Check your email</p>
        <p className="mt-2 text-sm text-muted">
          We sent a sign-in link to <strong>{email}</strong>. Open it in this browser to finish signing in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3">
        <button type="button" onClick={() => oauth("google")} className="btn-secondary w-full py-2.5">
          Continue with Google
        </button>
        <button type="button" onClick={() => oauth("github")} className="btn-secondary w-full py-2.5">
          Continue with GitHub
        </button>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>
      <form onSubmit={sendLink} className="space-y-3">
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="input"
        />
        <button type="submit" disabled={status === "sending"} className="btn-primary w-full py-2.5">
          {status === "sending" ? "Sending…" : "Email me a sign-in link"}
        </button>
      </form>
      {message && <p className="text-sm text-red-600">{message}</p>}
    </div>
  );
}
