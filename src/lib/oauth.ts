import "server-only";
import type { OAuthProfile } from "./auth";
import { secret } from "./secrets";

export type Provider = "google" | "github";

/** Short-lived cookie holding the OAuth state + PKCE verifier during sign-in. */
export const OAUTH_COOKIE = "oauth_state";

const CONFIG = {
  google: {
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: "openid email profile",
    idVar: "GOOGLE_CLIENT_ID",
    secretVar: "GOOGLE_CLIENT_SECRET",
  },
  github: {
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scope: "read:user user:email",
    idVar: "GITHUB_CLIENT_ID",
    secretVar: "GITHUB_CLIENT_SECRET",
  },
} as const;

export function isProvider(value: string): value is Provider {
  return value === "google" || value === "github";
}

function credentials(provider: Provider) {
  const c = CONFIG[provider];
  const clientId = secret(c.idVar);
  const clientSecret = secret(c.secretVar);
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

/** Providers with a client ID and secret configured. */
export function configuredProviders(): Provider[] {
  return (Object.keys(CONFIG) as Provider[]).filter((p) => credentials(p));
}

export function callbackUrl(origin: string, provider: Provider) {
  return `${origin}/auth/callback/${provider}`;
}

export function randomString(bytes = 32) {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...buf)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function pkceChallenge(verifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function authorizationUrl(provider: Provider, origin: string, state: string, verifier: string) {
  const creds = credentials(provider);
  if (!creds) return null;
  const c = CONFIG[provider];
  const url = new URL(c.authorizeUrl);
  url.searchParams.set("client_id", creds.clientId);
  url.searchParams.set("redirect_uri", callbackUrl(origin, provider));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", c.scope);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", await pkceChallenge(verifier));
  url.searchParams.set("code_challenge_method", "S256");
  if (provider === "google") url.searchParams.set("prompt", "select_account");
  return url.toString();
}

/** Exchanges the authorization code and returns the user's profile. */
export async function fetchProfile(provider: Provider, origin: string, code: string, verifier: string): Promise<OAuthProfile> {
  const creds = credentials(provider);
  if (!creds) throw new Error(`${provider} sign-in is not configured`);

  const tokenRes = await fetch(CONFIG[provider].tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      code,
      code_verifier: verifier,
      grant_type: "authorization_code",
      redirect_uri: callbackUrl(origin, provider),
    }),
  });
  const token = (await tokenRes.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!tokenRes.ok || !token.access_token) {
    throw new Error(`${provider} token exchange failed: ${token.error_description ?? token.error ?? tokenRes.status}`);
  }

  return provider === "google" ? googleProfile(token.access_token) : githubProfile(token.access_token);
}

async function googleProfile(accessToken: string): Promise<OAuthProfile> {
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Google userinfo failed: ${res.status}`);
  const u = (await res.json()) as { sub: string; email?: string; email_verified?: boolean; name?: string; picture?: string };
  return {
    provider: "google",
    providerUserId: u.sub,
    email: u.email && u.email_verified ? u.email.toLowerCase() : null,
    name: u.name || u.email?.split("@")[0] || "Anonymous",
    avatarUrl: u.picture ?? null,
  };
}

async function githubProfile(accessToken: string): Promise<OAuthProfile> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "site-1",
  };
  const [userRes, emailsRes] = await Promise.all([
    fetch("https://api.github.com/user", { headers }),
    fetch("https://api.github.com/user/emails", { headers }),
  ]);
  if (!userRes.ok) throw new Error(`GitHub user lookup failed: ${userRes.status}`);
  const u = (await userRes.json()) as { id: number; login: string; name?: string | null; avatar_url?: string };
  const emails = emailsRes.ok ? ((await emailsRes.json()) as { email: string; primary: boolean; verified: boolean }[]) : [];
  const primary = emails.find((e) => e.primary && e.verified);
  return {
    provider: "github",
    providerUserId: String(u.id),
    email: primary ? primary.email.toLowerCase() : null,
    name: u.name || u.login,
    avatarUrl: u.avatar_url ?? null,
  };
}
