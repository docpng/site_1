import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteProduct, saveProduct } from "@/app/actions/admin";
import { AdminForm, Field, TextArea, Toggle } from "@/components/admin/AdminForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { GalleryField } from "@/components/admin/GalleryField";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { ProductTypeFields } from "@/components/admin/ProductTypeFields";
import { getSettings } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

export default async function EditProduct({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const { saved } = await searchParams;
  const isNew = id === "new";
  const supabase = await createClient();
  let p: Product | null = null;
  if (!isNew) {
    const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle<Product>();
    if (!data) notFound();
    p = data;
  }
  const [{ data: projects }, settings] = await Promise.all([
    supabase.from("projects").select("id, title").order("title"),
    getSettings(),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Link href="/admin/products" className="text-sm text-brand-700 hover:underline">← Products</Link>
          <h1 className="mt-1 text-2xl font-bold">{isNew ? "New product" : p!.title}</h1>
        </div>
        {p && <DeleteButton action={deleteProduct} id={p.id} what="product" />}
      </div>
      <AdminForm action={saveProduct} savedInitially={saved === "1"}>
        {p && <input type="hidden" name="id" value={p.id} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" name="title" defaultValue={p?.title} required />
          <Field label="URL slug" name="slug" defaultValue={p?.slug} help="Leave blank to generate from the title." />
        </div>
        <TextArea label="Summary" name="summary" defaultValue={p?.summary} />
        <ProductTypeFields
          kind={p?.kind ?? "digital"}
          price={p && p.kind !== "free" ? (p.price_cents / 100).toFixed(2) : ""}
          stock={p?.stock ?? null}
          filePath={p?.file_path ?? null}
          fileName={p?.file_name ?? null}
          currency={settings.currency}
        />
        <GalleryField name="images" label="Photos" defaultValue={p?.images} />
        <MarkdownEditor name="description" label="Description" defaultValue={p?.description} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="project_id">Related project</label>
            <select id="project_id" name="project_id" defaultValue={p?.project_id ?? ""} className="input">
              <option value="">None</option>
              {(projects ?? []).map((pr) => (
                <option key={pr.id} value={pr.id}>{pr.title}</option>
              ))}
            </select>
          </div>
          <Field label="Sort order" name="sort_order" type="number" defaultValue={p?.sort_order ?? 0} help="Lower numbers show first." />
        </div>
        <Toggle label="Published" name="published" defaultChecked={p?.published} help="Visible in the shop." />
      </AdminForm>
    </div>
  );
}
