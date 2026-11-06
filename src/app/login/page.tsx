import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { safeNext } from "@/lib/safe-next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  const target = safeNext(typeof next === "string" ? next : null);
  if (await getCurrentUser()) redirect(target);

  return (
    <div className="container-page flex justify-center py-20">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="mt-2 mb-8 text-sm text-muted">Sign in to comment, leave reviews and access your purchases.</p>
        <LoginForm next={target} error={typeof error === "string" ? "That sign-in link didn't work. Please try again." : undefined} />
      </div>
    </div>
  );
}
