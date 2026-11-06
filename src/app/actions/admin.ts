"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { CONTENT_FIELDS, type SiteContent } from "@/lib/content";
import { parseTags, slugify } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { ProductKind, SocialLink } from "@/lib/types";

export type AdminFormState = { error?: string; ok?: boolean } | undefined;

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const nullable = (fd: FormData, key: string) => str(fd, key) || null;
const bool = (fd: FormData, key: string) => fd.get(key) === "on";
const int = (fd: FormData, key: string, fallback = 0) => {
  const n = Number.parseInt(str(fd, key), 10);
  return Number.isFinite(n) ? n : fallback;
};

function friendlyError(error: { code?: string; message: string }) {
  if (error.code === "23505") return "That slug is already used. Pick a different one.";
  if (error.code === "PGRST204" || /column .*content/.test(error.message)) {
    return "The database needs a small update first: run supabase/migrations/0002_site_content.sql in the Supabase SQL editor, then save again.";
  }
  if (error.code === "23514") return "Some values aren't allowed. Paid items need a price of at least 0.50; free items must be 0.";
  return error.message;
}

function revalidateSite() {
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export async function saveSettings(_prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  await requireAdmin();

  const social_links: SocialLink[] = str(fd, "social_links")
    .split("\n")
    .map((line) => {
      const [label, ...rest] = line.split("|");
      return { label: (label ?? "").trim(), url: rest.join("|").trim() };
    })
    .filter((l) => l.label && /^https?:\/\//.test(l.url));

  // Only accept the fields defined in src/lib/content.ts.
  const content: SiteContent = {};
  for (const field of CONTENT_FIELDS) {
    const key = field.key as keyof SiteContent;
    if (field.type === "toggle") content[key] = bool(fd, `content.${key}`) ? "true" : "false";
    else content[key] = String(fd.get(`content.${key}`) ?? "").trim().slice(0, 2000);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({
      site_name: str(fd, "site_name") || "My Site",
      tagline: str(fd, "tagline"),
      hero_title: str(fd, "hero_title"),
      hero_subtitle: str(fd, "hero_subtitle"),
      about_markdown: String(fd.get("about_markdown") ?? ""),
      footer_text: str(fd, "footer_text"),
      currency: (str(fd, "currency") || "usd").toLowerCase(),
      social_links,
      content,
    })
    .eq("id", 1);

  if (error) return { error: friendlyError(error) };
  revalidateSite();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export async function saveProject(_prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const id = str(fd, "id");
  const title = str(fd, "title");
  if (!title) return { error: "Title is required." };

  const row = {
    title,
    slug: slugify(str(fd, "slug") || title),
    summary: str(fd, "summary"),
    body: String(fd.get("body") ?? ""),
    cover_url: nullable(fd, "cover_url"),
    tags: parseTags(str(fd, "tags")),
    repo_url: nullable(fd, "repo_url"),
    live_url: nullable(fd, "live_url"),
    featured: bool(fd, "featured"),
    published: bool(fd, "published"),
    sort_order: int(fd, "sort_order"),
  };

  const supabase = await createClient();
  const result = id
    ? await supabase.from("projects").update(row).eq("id", id).select("id").single()
    : await supabase.from("projects").insert(row).select("id").single();
  if (result.error) return { error: friendlyError(result.error) };

  revalidateSite();
  if (!id) redirect(`/admin/projects/${result.data.id}?saved=1`);
  return { ok: true };
}

export async function deleteProject(fd: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("projects").delete().eq("id", str(fd, "id"));
  revalidateSite();
  redirect("/admin/projects");
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------
export async function savePost(_prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const id = str(fd, "id");
  const title = str(fd, "title");
  if (!title) return { error: "Title is required." };

  const published = bool(fd, "published");
  const supabase = await createClient();

  // Keep the original publish date when re-saving; set it the first time a post goes live.
  let published_at: string | null = null;
  if (published) {
    const chosen = str(fd, "published_at");
    if (chosen) {
      published_at = new Date(chosen).toISOString();
    } else if (id) {
      const { data } = await supabase.from("posts").select("published_at").eq("id", id).maybeSingle();
      published_at = data?.published_at ?? new Date().toISOString();
    } else {
      published_at = new Date().toISOString();
    }
  }

  const row = {
    title,
    slug: slugify(str(fd, "slug") || title),
    excerpt: str(fd, "excerpt"),
    body: String(fd.get("body") ?? ""),
    cover_url: nullable(fd, "cover_url"),
    tags: parseTags(str(fd, "tags")),
    project_id: nullable(fd, "project_id"),
    published,
    published_at,
  };

  const result = id
    ? await supabase.from("posts").update(row).eq("id", id).select("id").single()
    : await supabase.from("posts").insert(row).select("id").single();
  if (result.error) return { error: friendlyError(result.error) };

  revalidateSite();
  if (!id) redirect(`/admin/posts/${result.data.id}?saved=1`);
  return { ok: true };
}

export async function deletePost(fd: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("posts").delete().eq("id", str(fd, "id"));
  revalidateSite();
  redirect("/admin/posts");
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
export async function saveProduct(_prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const id = str(fd, "id");
  const title = str(fd, "title");
  if (!title) return { error: "Title is required." };

  const kind = str(fd, "kind") as ProductKind;
  if (!["digital", "physical", "free"].includes(kind)) return { error: "Choose a product type." };

  const price = Number.parseFloat(str(fd, "price") || "0");
  const price_cents = kind === "free" ? 0 : Math.round((Number.isFinite(price) ? price : 0) * 100);
  if (kind !== "free" && price_cents < 50) return { error: "Paid items need a price of at least 0.50 (Stripe's minimum)." };

  let images: string[] = [];
  try {
    images = JSON.parse(String(fd.get("images") ?? "[]"));
  } catch {}

  const stockRaw = str(fd, "stock");
  const row = {
    title,
    slug: slugify(str(fd, "slug") || title),
    summary: str(fd, "summary"),
    description: String(fd.get("description") ?? ""),
    kind,
    price_cents,
    images: images.filter((u) => typeof u === "string" && u),
    file_path: kind === "physical" ? null : nullable(fd, "file_path"),
    file_name: kind === "physical" ? null : nullable(fd, "file_name"),
    stock: kind === "physical" && stockRaw !== "" ? Math.max(0, int(fd, "stock")) : null,
    project_id: nullable(fd, "project_id"),
    published: bool(fd, "published"),
    sort_order: int(fd, "sort_order"),
  };

  if (row.published && kind !== "physical" && !row.file_path) {
    return { error: "Upload the downloadable file before publishing a digital or free item." };
  }

  const supabase = await createClient();
  const result = id
    ? await supabase.from("products").update(row).eq("id", id).select("id").single()
    : await supabase.from("products").insert(row).select("id").single();
  if (result.error) return { error: friendlyError(result.error) };

  revalidateSite();
  if (!id) redirect(`/admin/products/${result.data.id}?saved=1`);
  return { ok: true };
}

export async function deleteProduct(fd: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", str(fd, "id"));
  revalidateSite();
  redirect("/admin/products");
}

// ---------------------------------------------------------------------------
// Moderation & orders
// ---------------------------------------------------------------------------
export async function moderate(fd: FormData) {
  await requireAdmin();
  const table = str(fd, "table");
  if (table !== "comments" && table !== "reviews") return;
  const id = str(fd, "id");
  const action = str(fd, "action");

  const supabase = await createClient();
  if (action === "delete") await supabase.from(table).delete().eq("id", id);
  else await supabase.from(table).update({ hidden: action === "hide" }).eq("id", id);

  revalidateSite();
}

export async function setOrderStatus(fd: FormData) {
  await requireAdmin();
  const status = str(fd, "status");
  if (!["paid", "shipped", "refunded", "cancelled"].includes(status)) return;
  const supabase = await createClient();
  await supabase.from("orders").update({ status }).eq("id", str(fd, "id"));
  revalidatePath("/admin/orders");
}
