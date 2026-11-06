import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/settings", label: "Site settings" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/posts", label: "Blog posts" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/moderation", label: "Moderation" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[200px_1fr]">
      <aside>
        <p className="mb-3 text-xs font-semibold tracking-wider text-brand-600 uppercase">Admin</p>
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm whitespace-nowrap text-slate-700 hover:bg-brand-50 hover:text-brand-700">
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
