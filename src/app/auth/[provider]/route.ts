import { NextResponse } from "next/server";
import { authorizationUrl, isProvider, OAUTH_COOKIE, randomString } from "@/lib/oauth";
import { safeNext } from "@/lib/safe-next";

/** Starts Google / GitHub sign-in: /auth/google?next=/account */
export async function GET(request: Request, ctx: RouteContext<"/auth/[provider]">) {
  const { provider } = await ctx.params;
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));
  if (!isProvider(provider)) return NextResponse.redirect(new URL("/login", url.origin));

  const state = randomString();
  const verifier = randomString(48);
  const target = await authorizationUrl(provider, url.origin, state, verifier);
  if (!target) return NextResponse.redirect(new URL(`/login?error=unavailable&next=${encodeURIComponent(next)}`, url.origin));

  const res = NextResponse.redirect(target);
  res.cookies.set(OAUTH_COOKIE, JSON.stringify({ state, verifier, next, provider }), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/auth",
    maxAge: 600,
  });
  return res;
}
