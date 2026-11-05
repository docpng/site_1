import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { CartLink } from "./CartLink";

const NAV = [
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
];

export async function Header() {
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()]);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-ink">
          <span className="inline-block h-7 w-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700" aria-hidden />
          {settings.site_name}
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm font-medium text-slate-600 hover:text-brand-700">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <CartLink />
          {user ? (
            <>
              {user.profile?.is_admin && (
                <Link href="/admin" className="hidden text-sm font-medium text-brand-700 hover:underline sm:inline">
                  Admin
                </Link>
              )}
              <Link href="/account" className="text-sm font-medium text-slate-600 hover:text-brand-700">
                Account
              </Link>
            </>
          ) : (
            <Link href="/login" className="btn-primary py-1.5">
              Sign in
            </Link>
          )}

          <details className="relative md:hidden">
            <summary className="cursor-pointer list-none rounded-md p-1 text-slate-600 hover:bg-brand-50" aria-label="Menu">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            </summary>
            <div className="card absolute right-0 mt-2 w-48 p-2">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="block rounded-md px-3 py-2 text-sm hover:bg-brand-50">
                  {n.label}
                </Link>
              ))}
              {user?.profile?.is_admin && (
                <Link href="/admin" className="block rounded-md px-3 py-2 text-sm text-brand-700 hover:bg-brand-50">
                  Admin
                </Link>
              )}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
