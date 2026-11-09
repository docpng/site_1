import Link from "next/link";
import { all, first } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";

export default async function AdminDashboard() {
  const counts = await first<Record<string, number>>(
    `SELECT (SELECT COUNT(*) FROM projects) AS projects, (SELECT COUNT(*) FROM posts) AS posts,
            (SELECT COUNT(*) FROM products) AS products, (SELECT COUNT(*) FROM orders) AS orders,
            (SELECT COUNT(*) FROM comments) AS comments`,
  );
  const recentOrders = await all<{ id: string; created_at: string; amount_total: number; currency: string; status: string; email: string | null }>(
    "SELECT id, created_at, amount_total, currency, status, email FROM orders ORDER BY created_at DESC LIMIT 5",
  );
  const n = (k: string) => counts?.[k] ?? 0;

  const stats = [
    { label: "Projects", value: n("projects"), href: "/admin/projects" },
    { label: "Posts", value: n("posts"), href: "/admin/posts" },
    { label: "Products", value: n("products"), href: "/admin/products" },
    { label: "Orders", value: n("orders"), href: "/admin/orders" },
    { label: "Comments", value: n("comments"), href: "/admin/moderation" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card p-4 hover:border-brand-200">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-brand-700">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/posts/new" className="btn-primary">New post</Link>
        <Link href="/admin/projects/new" className="btn-secondary">New project</Link>
        <Link href="/admin/products/new" className="btn-secondary">New product</Link>
      </div>

      <h2 className="mt-12 text-lg font-semibold">Recent orders</h2>
      <ul className="card mt-3 divide-y divide-line">
        {recentOrders.length === 0 && <li className="p-4 text-sm text-muted">No orders yet.</li>}
        {recentOrders.map((o) => (
          <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
            <span>{formatDate(o.created_at)}</span>
            <span className="text-muted">{o.email}</span>
            <span className="badge capitalize">{o.status}</span>
            <span className="font-semibold">{formatPrice(o.amount_total, o.currency)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
