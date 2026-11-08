import { AdminList } from "@/components/admin/AdminList";
import { toProject } from "@/lib/data";
import { all } from "@/lib/db";

export default async function AdminProjects() {
  const data = (await all<Record<string, unknown>>("SELECT * FROM projects ORDER BY sort_order, created_at DESC")).map(toProject);
  return (
    <AdminList
      title="Projects"
      newHref="/admin/projects/new"
      rows={(data ?? []).map((p) => ({
        id: p.id,
        href: `/admin/projects/${p.id}`,
        viewHref: `/projects/${p.slug}`,
        title: p.title,
        meta: `${p.featured ? "★ Featured · " : ""}/${p.slug}`,
        published: p.published,
      }))}
    />
  );
}
