import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { first, newId, now, run } from "./db";
import { adminEmails } from "./secrets";
import type { Profile } from "./types";

export const SESSION_COOKIE = "sid";
const SESSION_DAYS = 30;

export type CurrentUser = {
  id: string;
  email: string | null;
  profile: Profile;
};

function randomToken(bytes = 32) {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...buf)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sha256(input: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function sessionCookieOptions(expires: Date) {
  return { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", expires };
}

/** Creates a session row and returns the raw token for the cookie. */
export async function createSession(userId: string) {
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await run("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", await sha256(token), userId, expires.toISOString());
  // Opportunistic cleanup of expired sessions.
  await run("DELETE FROM sessions WHERE expires_at < ?", now());
  return { token, expires };
}

/** The signed-in user, or null. Deduplicated per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = await first<{
    id: string;
    email: string | null;
    display_name: string;
    avatar_url: string | null;
    is_admin: number;
    created_at: string;
  }>(
    `SELECT u.id, u.email, u.display_name, u.avatar_url, u.is_admin, u.created_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > ?`,
    await sha256(token),
    now(),
  );
  if (!row) return null;

  const isAdmin = row.is_admin === 1 || (!!row.email && adminEmails().includes(row.email.toLowerCase()));
  return {
    id: row.id,
    email: row.email,
    profile: { ...row, is_admin: isAdmin },
  };
});

export async function requireUser(next = "/account"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Use at the top of every admin page, admin Server Action and admin route. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser("/admin");
  if (!user.profile.is_admin) redirect("/");
  return user;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await run("DELETE FROM sessions WHERE id = ?", await sha256(token));
  store.delete(SESSION_COOKIE);
}

// ---------------------------------------------------------------------------
// Account linking for Google / GitHub sign-in
// ---------------------------------------------------------------------------
export type OAuthProfile = {
  provider: "google" | "github";
  providerUserId: string;
  email: string | null; // verified emails only
  name: string;
  avatarUrl: string | null;
};

/** Finds or creates the user for an OAuth identity and returns their id. */
export async function upsertOAuthUser(p: OAuthProfile): Promise<string> {
  const linked = await first<{ user_id: string }>(
    "SELECT user_id FROM oauth_accounts WHERE provider = ? AND provider_user_id = ?",
    p.provider,
    p.providerUserId,
  );
  if (linked) {
    // Fill in details that may have been missing before.
    await run(
      `UPDATE users SET avatar_url = COALESCE(avatar_url, ?),
              email = COALESCE(email, (SELECT ? WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = ?)))
        WHERE id = ?`,
      p.avatarUrl,
      p.email,
      p.email,
      linked.user_id,
    );
    return linked.user_id;
  }

  // Same verified email as an existing account (e.g. signed in with Google before, now GitHub): link them.
  const byEmail = p.email ? await first<{ id: string }>("SELECT id FROM users WHERE email = ?", p.email) : null;
  const userId = byEmail?.id ?? newId();
  if (!byEmail) {
    await run(
      "INSERT INTO users (id, email, display_name, avatar_url) VALUES (?, ?, ?, ?)",
      userId,
      p.email,
      p.name.slice(0, 60) || "Anonymous",
      p.avatarUrl,
    );
  }
  await run(
    "INSERT INTO oauth_accounts (provider, provider_user_id, user_id) VALUES (?, ?, ?)",
    p.provider,
    p.providerUserId,
    userId,
  );
  return userId;
}
