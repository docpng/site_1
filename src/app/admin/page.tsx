import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatPrice } from "@/lib/format";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const count = (table: string) => supabase.from(table).select("*", { count: "exact", head: true });
  const [projects, posts, products, orders, comments, recentOrders] = await Promise.all([
    count("projects"),
    count("posts"),
    count("products"),
    count("orders"),
    count("comments"),
    supabase.from("orders").select("id, created_at, amount_total, currency, status, email").order("created_at", { ascending: false }).limit(5),
  ]);

  const stats = [
    { label: "Projects", value: projects.count ?? 0, href: "/admin/projects" },
    { label: "Posts", value: posts.count ?? 0, href: "/admin/posts" },
    { label: "Products", value: products.count ?? 0, href: "/admin/products" },
    { label: "Orders", value: orders.count ?? 0, href: "/admin/orders" },
    { label: "Comments", value: comments.count ?? 0, href: "/admin/moderation" },
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
        {(recentOrders.data ?? []).length === 0 && <li className="p-4 text-sm text-muted">No orders yet.</li>}
        {(recentOrders.data ?? []).map((o) => (
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
