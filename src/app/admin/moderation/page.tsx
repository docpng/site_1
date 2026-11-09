import Link from "next/link";
import { moderate } from "@/app/actions/admin";
import { formatDate } from "@/lib/format";
import { all } from "@/lib/db";

export default async function Moderation() {
  type Flat = { id: string; body: string; hidden: number; created_at: string; author_name: string | null; ref_title: string | null; ref_slug: string | null };
  const [commentRows, reviewRows] = await Promise.all([
    all<Flat>(
      `SELECT c.id, c.body, c.hidden, c.created_at, u.display_name AS author_name, p.title AS ref_title, p.slug AS ref_slug
         FROM comments c LEFT JOIN users u ON u.id = c.user_id LEFT JOIN posts p ON p.id = c.post_id
        ORDER BY c.created_at DESC LIMIT 100`,
    ),
    all<Flat & { title: string; rating: number }>(
      `SELECT r.id, r.body, r.title, r.rating, r.hidden, r.created_at, u.display_name AS author_name, p.title AS ref_title, p.slug AS ref_slug
         FROM reviews r LEFT JOIN users u ON u.id = r.user_id LEFT JOIN products p ON p.id = r.product_id
        ORDER BY r.created_at DESC LIMIT 100`,
    ),
  ]);
  const base = (r: Flat) => ({
    id: r.id,
    body: r.body,
    created_at: r.created_at,
    hidden: r.hidden === 1,
    author: r.author_name ? { display_name: r.author_name } : null,
  });
  const ref = (r: Flat) => (r.ref_slug ? { title: r.ref_title ?? "", slug: r.ref_slug } : null);
  const comments = commentRows.map((r) => ({ ...base(r), post: ref(r) }));
  const reviews = reviewRows.map((r) => ({ ...base(r), title: r.title, rating: r.rating, product: ref(r) }));

  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-2xl font-bold">Comments</h1>
        <ul className="card mt-4 divide-y divide-line">
          {!comments?.length && <li className="p-4 text-sm text-muted">No comments yet.</li>}
          {comments?.map((c) => (
            <li key={c.id} className={`p-4 ${c.hidden ? "bg-slate-50 opacity-70" : ""}`}>
              <p className="text-xs text-muted">
                <strong className="text-ink">{c.author?.display_name}</strong> on{" "}
                {c.post && <Link href={`/blog/${c.post.slug}#comments`} className="text-brand-700 hover:underline">{c.post.title}</Link>} ·{" "}
                {formatDate(c.created_at)} {c.hidden && "· hidden"}
              </p>
              <p className="mt-1 text-sm whitespace-pre-wrap">{c.body}</p>
              <ModActions table="comments" id={c.id} hidden={c.hidden} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Reviews</h2>
        <ul className="card mt-4 divide-y divide-line">
          {!reviews?.length && <li className="p-4 text-sm text-muted">No reviews yet.</li>}
          {reviews?.map((r) => (
            <li key={r.id} className={`p-4 ${r.hidden ? "bg-slate-50 opacity-70" : ""}`}>
              <p className="text-xs text-muted">
                <strong className="text-ink">{r.author?.display_name}</strong> rated{" "}
                {r.product && <Link href={`/shop/${r.product.slug}#reviews`} className="text-brand-700 hover:underline">{r.product.title}</Link>}{" "}
                {"★".repeat(r.rating)} · {formatDate(r.created_at)} {r.hidden && "· hidden"}
              </p>
              {r.title && <p className="mt-1 text-sm font-medium">{r.title}</p>}
              <p className="mt-1 text-sm whitespace-pre-wrap">{r.body}</p>
              <ModActions table="reviews" id={r.id} hidden={r.hidden} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ModActions({ table, id, hidden }: { table: string; id: string; hidden: boolean }) {
  return (
    <div className="mt-2 flex gap-2">
      <form action={moderate}>
        <input type="hidden" name="table" value={table} />
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="action" value={hidden ? "show" : "hide"} />
        <button className="btn-secondary py-1 text-xs">{hidden ? "Unhide" : "Hide"}</button>
      </form>
      <form action={moderate}>
        <input type="hidden" name="table" value={table} />
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="action" value="delete" />
        <button className="btn-danger py-1 text-xs">Delete</button>
      </form>
    </div>
  );
}
