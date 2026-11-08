import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteProject, saveProject } from "@/app/actions/admin";
import { AdminForm, Field, TextArea, Toggle } from "@/components/admin/AdminForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ImageField } from "@/components/admin/ImageField";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { toProject } from "@/lib/data";
import { first } from "@/lib/db";
import type { Project } from "@/lib/types";

export default async function EditProject({ params, searchParams }: PageProps<"/admin/projects/[id]">) {
  const { id } = await params;
  const { saved } = await searchParams;
  const isNew = id === "new";
  let p: Project | null = null;
  if (!isNew) {
    const row = await first<Record<string, unknown>>("SELECT * FROM projects WHERE id = ?", id);
    if (!row) notFound();
    p = toProject(row);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Link href="/admin/projects" className="text-sm text-brand-700 hover:underline">← Projects</Link>
          <h1 className="mt-1 text-2xl font-bold">{isNew ? "New project" : p!.title}</h1>
        </div>
        {p && <DeleteButton action={deleteProject} id={p.id} what="project" />}
      </div>
      <AdminForm action={saveProject} savedInitially={saved === "1"}>
        {p && <input type="hidden" name="id" value={p.id} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" name="title" defaultValue={p?.title} required />
          <Field label="URL slug" name="slug" defaultValue={p?.slug} help="Leave blank to generate from the title." />
        </div>
        <TextArea label="Summary" name="summary" defaultValue={p?.summary} help="Shown on cards and at the top of the project page." />
        <ImageField name="cover_url" label="Cover image" defaultValue={p?.cover_url} />
        <MarkdownEditor name="body" label="Project page" defaultValue={p?.body} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Live URL" name="live_url" type="url" defaultValue={p?.live_url} />
          <Field label="Source code URL" name="repo_url" type="url" defaultValue={p?.repo_url} />
          <Field label="Tags" name="tags" defaultValue={p?.tags.join(", ")} help="Comma separated." />
          <Field label="Sort order" name="sort_order" type="number" defaultValue={p?.sort_order ?? 0} help="Lower numbers show first." />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle label="Published" name="published" defaultChecked={p?.published} help="Visible on the public site." />
          <Toggle label="Featured" name="featured" defaultChecked={p?.featured} help="Shown on the homepage." />
        </div>
      </AdminForm>
    </div>
  );
}
