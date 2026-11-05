import { AdminList } from "@/components/admin/AdminList";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";

export default async function AdminProjects() {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("*").order("sort_order").order("created_at", { ascending: false }).returns<Project[]>();
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
