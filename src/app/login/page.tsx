import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { text } from "@/lib/content";
import { getSettings } from "@/lib/data";
import { configuredProviders, type Provider } from "@/lib/oauth";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  state: "Sign-in timed out or was started in another tab. Please try again.",
  signin: "We couldn't sign you in. Please try again.",
  unavailable: "That sign-in option isn't set up yet.",
};

const LABELS: Record<Provider, string> = { google: "Continue with Google", github: "Continue with GitHub" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  const target = safeNext(typeof next === "string" ? next : null);
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  if (user) redirect(target);
  const providers = configuredProviders();

  return (
    <div className="container-page flex justify-center py-20">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">{text(settings, "login_title")}</h1>
        <p className="mt-2 mb-8 text-sm text-muted">{text(settings, "login_intro")}</p>
        <div className="grid gap-3">
          {providers.map((p) => (
            // Plain links (not <Link>) so the browser follows the redirect to Google/GitHub.
            <a key={p} href={`/auth/${p}?next=${encodeURIComponent(target)}`} className="btn-secondary w-full py-2.5">
              <ProviderIcon provider={p} />
              {LABELS[p]}
            </a>
          ))}
          {providers.length === 0 && (
            <p className="rounded-lg bg-brand-50 p-4 text-sm">
              Sign-in isn&apos;t configured yet. Add the Google or GitHub client ID and secret to the Worker (see the README).
            </p>
          )}
        </div>
        {typeof error === "string" && <p className="mt-4 text-sm text-red-600">{ERRORS[error] ?? ERRORS.signin}</p>}
      </div>
    </div>
  );
}

function ProviderIcon({ provider }: { provider: Provider }) {
  return provider === "google" ? (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5z" />
    </svg>
  );
}
