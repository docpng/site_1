import { AdminList } from "@/components/admin/AdminList";
import { formatDate } from "@/lib/format";
import { toPost } from "@/lib/data";
import { all } from "@/lib/db";

export default async function AdminPosts() {
  const data = (await all<Record<string, unknown>>("SELECT * FROM posts ORDER BY created_at DESC")).map(toPost);
  return (
    <AdminList
      title="Blog posts"
      newHref="/admin/posts/new"
      rows={(data ?? []).map((p) => ({
        id: p.id,
        href: `/admin/posts/${p.id}`,
        viewHref: `/blog/${p.slug}`,
        title: p.title,
        meta: p.published ? `Published ${formatDate(p.published_at)}` : `Last edited ${formatDate(p.updated_at)}`,
        published: p.published,
      }))}
    />
  );
}
