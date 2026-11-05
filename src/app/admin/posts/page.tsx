import { AdminList } from "@/components/admin/AdminList";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";

export default async function AdminPosts() {
  const supabase = await createClient();
  const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).returns<Post[]>();
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
