"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { CONTENT_FIELDS, type SiteContent } from "@/lib/content";
import { first, isCheckViolation, isUniqueViolation, newId, now, run } from "@/lib/db";
import { parseTags, slugify } from "@/lib/format";
import type { ProductKind, SocialLink } from "@/lib/types";

export type AdminFormState = { error?: string; ok?: boolean } | undefined;

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const nullable = (fd: FormData, key: string) => str(fd, key) || null;
const bool = (fd: FormData, key: string) => fd.get(key) === "on";
const int = (fd: FormData, key: string, fallback = 0) => {
  const n = Number.parseInt(str(fd, key), 10);
  return Number.isFinite(n) ? n : fallback;
};

function friendlyError(err: unknown) {
  if (isUniqueViolation(err)) return "That slug is already used. Pick a different one.";
  if (isCheckViolation(err)) return "Some values aren't allowed. Paid items need a price of at least 0.50; free items must be 0.";
  console.error(err);
  return "Couldn't save. Please try again.";
}

function revalidateSite() {
  revalidatePath("/", "layout");
}

type Value = string | number | null;

/** Inserts (no id) or updates (with id) a row and returns its id. Table and column names are fixed in code. */
async function saveRow(table: "projects" | "posts" | "products", id: string, row: Record<string, Value>) {
  const cols = Object.keys(row);
  if (id) {
    await run(
      `UPDATE ${table} SET ${cols.map((c) => `${c} = ?`).join(", ")}, updated_at = ? WHERE id = ?`,
      ...cols.map((c) => row[c]),
      now(),
      id,
    );
    return id;
  }
  const newRowId = newId();
  await run(
    `INSERT INTO ${table} (id, ${cols.join(", ")}) VALUES (?, ${cols.map(() => "?").join(", ")})`,
    newRowId,
    ...cols.map((c) => row[c]),
  );
  return newRowId;
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

  const data = {
    site_name: str(fd, "site_name") || "My Site",
    tagline: str(fd, "tagline"),
    hero_title: str(fd, "hero_title"),
    hero_subtitle: str(fd, "hero_subtitle"),
    about_markdown: String(fd.get("about_markdown") ?? ""),
    footer_text: str(fd, "footer_text"),
    currency: (str(fd, "currency") || "usd").toLowerCase().slice(0, 3),
    social_links,
    content,
  };

  try {
    await run(
      `INSERT INTO site_settings (id, data, updated_at) VALUES (1, ?, ?)
       ON CONFLICT (id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
      JSON.stringify(data),
      now(),
    );
  } catch (err) {
    return { error: friendlyError(err) };
  }
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

  let savedId: string;
  try {
    savedId = await saveRow("projects", id, {
      title,
      slug: slugify(str(fd, "slug") || title),
      summary: str(fd, "summary"),
      body: String(fd.get("body") ?? ""),
      cover_url: nullable(fd, "cover_url"),
      tags: JSON.stringify(parseTags(str(fd, "tags"))),
      repo_url: nullable(fd, "repo_url"),
      live_url: nullable(fd, "live_url"),
      featured: bool(fd, "featured") ? 1 : 0,
      published: bool(fd, "published") ? 1 : 0,
      sort_order: int(fd, "sort_order"),
    });
  } catch (err) {
    return { error: friendlyError(err) };
  }

  revalidateSite();
  if (!id) redirect(`/admin/projects/${savedId}?saved=1`);
  return { ok: true };
}

export async function deleteProject(fd: FormData) {
  await requireAdmin();
  await run("DELETE FROM projects WHERE id = ?", str(fd, "id"));
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
  // Keep the original publish date when re-saving; set it the first time a post goes live.
  let published_at: string | null = null;
  if (published) {
    const chosen = str(fd, "published_at");
    if (chosen && !Number.isNaN(Date.parse(chosen))) {
      published_at = new Date(chosen).toISOString();
    } else if (id) {
      const existing = await first<{ published_at: string | null }>("SELECT published_at FROM posts WHERE id = ?", id);
      published_at = existing?.published_at ?? now();
    } else {
      published_at = now();
    }
  }

  const projectId = nullable(fd, "project_id");
  if (projectId && !(await first("SELECT 1 FROM projects WHERE id = ?", projectId))) {
    return { error: "That project no longer exists." };
  }

  let savedId: string;
  try {
    savedId = await saveRow("posts", id, {
      title,
      slug: slugify(str(fd, "slug") || title),
      excerpt: str(fd, "excerpt"),
      body: String(fd.get("body") ?? ""),
      cover_url: nullable(fd, "cover_url"),
      tags: JSON.stringify(parseTags(str(fd, "tags"))),
      project_id: projectId,
      published: published ? 1 : 0,
      published_at,
    });
  } catch (err) {
    return { error: friendlyError(err) };
  }

  revalidateSite();
  if (!id) redirect(`/admin/posts/${savedId}?saved=1`);
  return { ok: true };
}

export async function deletePost(fd: FormData) {
  await requireAdmin();
  await run("DELETE FROM posts WHERE id = ?", str(fd, "id"));
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
    const parsed = JSON.parse(String(fd.get("images") ?? "[]"));
    if (Array.isArray(parsed)) images = parsed.filter((u): u is string => typeof u === "string" && u.length > 0);
  } catch {}

  const fileKey = kind === "physical" ? null : nullable(fd, "file_key");
  // Product files must live in the private downloads/ area of the bucket.
  if (fileKey && !fileKey.startsWith("downloads/")) return { error: "Please re-upload the downloadable file." };

  const published = bool(fd, "published");
  if (published && kind !== "physical" && !fileKey) {
    return { error: "Upload the downloadable file before publishing a digital or free item." };
  }

  const projectId = nullable(fd, "project_id");
  if (projectId && !(await first("SELECT 1 FROM projects WHERE id = ?", projectId))) {
    return { error: "That project no longer exists." };
  }

  const stockRaw = str(fd, "stock");
  let savedId: string;
  try {
    savedId = await saveRow("products", id, {
      title,
      slug: slugify(str(fd, "slug") || title),
      summary: str(fd, "summary"),
      description: String(fd.get("description") ?? ""),
      kind,
      price_cents,
      images: JSON.stringify(images),
      file_key: fileKey,
      file_name: kind === "physical" ? null : nullable(fd, "file_name"),
      stock: kind === "physical" && stockRaw !== "" ? Math.max(0, int(fd, "stock")) : null,
      project_id: projectId,
      published: published ? 1 : 0,
      sort_order: int(fd, "sort_order"),
    });
  } catch (err) {
    return { error: friendlyError(err) };
  }

  revalidateSite();
  if (!id) redirect(`/admin/products/${savedId}?saved=1`);
  return { ok: true };
}

export async function deleteProduct(fd: FormData) {
  await requireAdmin();
  await run("DELETE FROM products WHERE id = ?", str(fd, "id"));
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

  if (action === "delete") await run(`DELETE FROM ${table} WHERE id = ?`, id);
  else await run(`UPDATE ${table} SET hidden = ? WHERE id = ?`, action === "hide" ? 1 : 0, id);

  revalidateSite();
}

export async function setOrderStatus(fd: FormData) {
  await requireAdmin();
  const status = str(fd, "status");
  if (!["paid", "shipped", "refunded", "cancelled"].includes(status)) return;
  await run("UPDATE orders SET status = ? WHERE id = ?", status, str(fd, "id"));
  revalidatePath("/admin/orders");
}

