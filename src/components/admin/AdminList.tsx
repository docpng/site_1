import Link from "next/link";

export function AdminList({ title, newHref, rows }: {
  title: string;
  newHref: string;
  rows: { id: string; href: string; title: string; meta?: string; published: boolean; viewHref?: string }[];
}) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Link href={newHref} className="btn-primary">
          + New
        </Link>
      </div>
      <ul className="card divide-y divide-line">
        {rows.length === 0 && <li className="p-6 text-sm text-muted">Nothing here yet.</li>}
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-3 p-4">
            <Link href={r.href} className="min-w-0 flex-1">
              <p className="truncate font-medium hover:text-brand-700">{r.title}</p>
              {r.meta && <p className="truncate text-xs text-muted">{r.meta}</p>}
            </Link>
            <span className={`badge ${r.published ? "" : "bg-slate-100 text-slate-600"}`}>{r.published ? "Published" : "Draft"}</span>
            {r.viewHref && r.published && (
              <Link href={r.viewHref} className="text-sm text-brand-700 hover:underline">
                View
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
