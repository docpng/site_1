import { NextResponse, type NextRequest } from "next/server";
import { createSession, SESSION_COOKIE, sessionCookieOptions, upsertOAuthUser } from "@/lib/auth";
import { fetchProfile, isProvider, OAUTH_COOKIE } from "@/lib/oauth";
import { safeNext } from "@/lib/safe-next";

/** Google / GitHub send people back here after they approve sign-in. */
export async function GET(request: NextRequest, ctx: RouteContext<"/auth/callback/[provider]">) {
  const { provider } = await ctx.params;
  const url = new URL(request.url);

  let saved: { state?: string; verifier?: string; next?: string; provider?: string } = {};
  try {
    saved = JSON.parse(request.cookies.get(OAUTH_COOKIE)?.value ?? "{}");
  } catch {}
  const next = safeNext(saved.next);
  const fail = (reason: string) => {
    const res = NextResponse.redirect(new URL(`/login?error=${reason}&next=${encodeURIComponent(next)}`, url.origin));
    res.cookies.delete({ name: OAUTH_COOKIE, path: "/auth" });
    return res;
  };

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!isProvider(provider) || saved.provider !== provider) return fail("state");
  if (!code || !state || !saved.state || state !== saved.state || !saved.verifier) return fail("state");

  try {
    const profile = await fetchProfile(provider, url.origin, code, saved.verifier);
    const userId = await upsertOAuthUser(profile);
    const { token, expires } = await createSession(userId);

    const res = NextResponse.redirect(new URL(next, url.origin));
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expires));
    res.cookies.delete({ name: OAUTH_COOKIE, path: "/auth" });
    return res;
  } catch (err) {
    console.error("Sign-in failed", err);
    return fail("signin");
  }
}
