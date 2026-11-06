import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { text } from "@/lib/content";
import { getSettings } from "@/lib/data";
import { safeNext } from "@/lib/safe-next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  const target = safeNext(typeof next === "string" ? next : null);
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  if (user) redirect(target);

  return (
    <div className="container-page flex justify-center py-20">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">{text(settings, "login_title")}</h1>
        <p className="mt-2 mb-8 text-sm text-muted">{text(settings, "login_intro")}</p>
        <LoginForm next={target} error={typeof error === "string" ? "That sign-in link didn't work. Please try again." : undefined} />
      </div>
    </div>
  );
}
