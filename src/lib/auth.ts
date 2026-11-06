import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

export type CurrentUser = {
  id: string;
  email: string | null;
  profile: Profile | null;
};

/** The signed-in user (validated with Supabase), or null. Deduplicated per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  return { id: user.id, email: user.email ?? null, profile: profile ?? null };
});

export async function requireUser(next = "/account"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Use at the top of every admin page and admin Server Action. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser("/admin");
  if (!user.profile?.is_admin) redirect("/");
  return user;
}
