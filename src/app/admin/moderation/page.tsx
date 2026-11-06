import Link from "next/link";
import { moderate } from "@/app/actions/admin";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type Row = {
  id: string;
  body: string;
  hidden: boolean;
  created_at: string;
  author: { display_name: string } | null;
};

export default async function Moderation() {
  const supabase = await createClient();
  const [{ data: comments }, { data: reviews }] = await Promise.all([
    supabase
      .from("comments")
      .select("id, body, hidden, created_at, author:profiles(display_name), post:posts(title, slug)")
      .order("created_at", { ascending: false })
      .limit(100)
      .returns<(Row & { post: { title: string; slug: string } | null })[]>(),
    supabase
      .from("reviews")
      .select("id, body, title, rating, hidden, created_at, author:profiles(display_name), product:products(title, slug)")
      .order("created_at", { ascending: false })
      .limit(100)
      .returns<(Row & { title: string; rating: number; product: { title: string; slug: string } | null })[]>(),
  ]);

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
