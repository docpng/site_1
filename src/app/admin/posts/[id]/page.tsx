import Link from "next/link";
import { notFound } from "next/navigation";
import { deletePost, savePost } from "@/app/actions/admin";
import { AdminForm, Field, TextArea, Toggle } from "@/components/admin/AdminForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ImageField } from "@/components/admin/ImageField";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { toPost } from "@/lib/data";
import { all, first } from "@/lib/db";
import type { Post } from "@/lib/types";

export default async function EditPost({ params, searchParams }: PageProps<"/admin/posts/[id]">) {
  const { id } = await params;
  const { saved } = await searchParams;
  const isNew = id === "new";
  let p: Post | null = null;
  if (!isNew) {
    const row = await first<Record<string, unknown>>("SELECT * FROM posts WHERE id = ?", id);
    if (!row) notFound();
    p = toPost(row);
  }
  const projects = await all<{ id: string; title: string }>("SELECT id, title FROM projects ORDER BY title");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Link href="/admin/posts" className="text-sm text-brand-700 hover:underline">← Posts</Link>
          <h1 className="mt-1 text-2xl font-bold">{isNew ? "New post" : p!.title}</h1>
        </div>
        {p && <DeleteButton action={deletePost} id={p.id} what="post" />}
      </div>
      <AdminForm action={savePost} savedInitially={saved === "1"}>
        {p && <input type="hidden" name="id" value={p.id} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" name="title" defaultValue={p?.title} required />
          <Field label="URL slug" name="slug" defaultValue={p?.slug} help="Leave blank to generate from the title." />
        </div>
        <TextArea label="Excerpt" name="excerpt" defaultValue={p?.excerpt} help="One or two sentences for the blog index." />
        <ImageField name="cover_url" label="Cover image" defaultValue={p?.cover_url} />
        <MarkdownEditor name="body" label="Post" defaultValue={p?.body} rows={24} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Tags" name="tags" defaultValue={p?.tags.join(", ")} help="Comma separated." />
          <div>
            <label className="label" htmlFor="project_id">Related project</label>
            <select id="project_id" name="project_id" defaultValue={p?.project_id ?? ""} className="input">
              <option value="">None</option>
              {(projects ?? []).map((pr) => (
                <option key={pr.id} value={pr.id}>{pr.title}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">Shows up in the project&apos;s build log.</p>
          </div>
          <Field
            label="Publish date"
            name="published_at"
            type="date"
            defaultValue={p?.published_at?.slice(0, 10)}
            help="Optional. Defaults to when you first publish."
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle label="Published" name="published" defaultChecked={p?.published} help="Visible on the blog and open for comments." />
          <Toggle label="Featured on homepage" name="featured" defaultChecked={p?.featured} help="The newest featured post gets the big spot on the homepage." />
        </div>
      </AdminForm>
    </div>
  );
}
