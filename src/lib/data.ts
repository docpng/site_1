import "server-only";
import { cache } from "react";
import { all, first, parseJson, parseList } from "./db";
import type { Author, Comment, Order, OrderItem, Post, Product, Project, Review, SiteSettings } from "./types";

// ---------------------------------------------------------------------------
// Row mappers: D1 stores booleans as 0/1 and arrays as JSON text.
// ---------------------------------------------------------------------------
type Row = Record<string, unknown>;
const bool = (v: unknown) => v === 1 || v === true;

export function toProject(r: Row): Project {
  return { ...(r as unknown as Project), tags: parseList(r.tags), featured: bool(r.featured), published: bool(r.published) };
}

export function toPost(r: Row): Post {
  return { ...(r as unknown as Post), tags: parseList(r.tags), featured: bool(r.featured), published: bool(r.published) };
}

export function toProduct(r: Row): Product {
  return { ...(r as unknown as Product), images: parseList(r.images), featured: bool(r.featured), published: bool(r.published) };
}

function author(r: Row): Author | null {
  return r.author_name == null ? null : { display_name: String(r.author_name), avatar_url: (r.author_avatar as string) ?? null };
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export const DEFAULT_SETTINGS: SiteSettings = {
  site_name: "My Site",
  tagline: "Projects, products and notes from the workshop.",
  hero_title: "Things I build, and how I build them.",
  hero_subtitle: "A home for my projects, products and a running log of what I make.",
  about_markdown: "Write something about yourself in **Admin → Site settings**.",
  footer_text: "",
  social_links: [],
  currency: "usd",
  content: {},
  updated_at: new Date(0).toISOString(),
};

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const row = await first<{ data: string; updated_at: string }>("SELECT data, updated_at FROM site_settings WHERE id = 1");
  const saved = parseJson<Partial<SiteSettings>>(row?.data, {});
  return { ...DEFAULT_SETTINGS, ...saved, content: saved.content ?? {}, updated_at: row?.updated_at ?? DEFAULT_SETTINGS.updated_at };
});

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export async function listProjects(opts: { featured?: boolean; limit?: number } = {}) {
  const rows = await all<Row>(
    `SELECT * FROM projects WHERE published = 1 ${opts.featured ? "AND featured = 1" : ""}
     ORDER BY sort_order ASC, created_at DESC LIMIT ?`,
    opts.limit ?? 500,
  );
  return rows.map(toProject);
}

export async function getProject(slug: string) {
  const row = await first<Row>("SELECT * FROM projects WHERE slug = ? AND published = 1", slug);
  return row ? toProject(row) : null;
}

// ---------------------------------------------------------------------------
// Posts & comments
// ---------------------------------------------------------------------------
export async function listPosts(opts: { limit?: number; projectId?: string; tag?: string; featured?: boolean } = {}) {
  const where = ["published = 1"];
  if (opts.featured) where.push("featured = 1");
  const params: (string | number)[] = [];
  if (opts.projectId) {
    where.push("project_id = ?");
    params.push(opts.projectId);
  }
  if (opts.tag) {
    where.push("EXISTS (SELECT 1 FROM json_each(posts.tags) WHERE json_each.value = ?)");
    params.push(opts.tag);
  }
  const rows = await all<Row>(
    `SELECT * FROM posts WHERE ${where.join(" AND ")} ORDER BY published_at DESC LIMIT ?`,
    ...params,
    opts.limit ?? 500,
  );
  return rows.map(toPost);
}

export async function getPost(slug: string) {
  const row = await first<Row>("SELECT * FROM posts WHERE slug = ? AND published = 1", slug);
  return row ? toPost(row) : null;
}

/** Visible comments, plus the viewer's own hidden ones (admins see everything). */
export async function listComments(postId: string, viewer?: { id: string; isAdmin: boolean } | null) {
  const rows = await all<Row>(
    `SELECT c.*, u.display_name AS author_name, u.avatar_url AS author_avatar
       FROM comments c LEFT JOIN users u ON u.id = c.user_id
      WHERE c.post_id = ? AND (c.hidden = 0 OR c.user_id = ? OR ? = 1)
      ORDER BY c.created_at ASC`,
    postId,
    viewer?.id ?? "",
    viewer?.isAdmin ? 1 : 0,
  );
  return rows.map((r) => ({ ...(r as unknown as Comment), hidden: bool(r.hidden), author: author(r) }));
}

// ---------------------------------------------------------------------------
// Products & reviews
// ---------------------------------------------------------------------------
export async function listProducts(opts: { kind?: string; projectId?: string; limit?: number; featured?: boolean } = {}) {
  const where = ["published = 1"];
  if (opts.featured) where.push("featured = 1");
  const params: (string | number)[] = [];
  if (opts.kind) {
    where.push("kind = ?");
    params.push(opts.kind);
  }
  if (opts.projectId) {
    where.push("project_id = ?");
    params.push(opts.projectId);
  }
  const rows = await all<Row>(
    `SELECT * FROM products WHERE ${where.join(" AND ")} ORDER BY sort_order ASC, created_at DESC LIMIT ?`,
    ...params,
    opts.limit ?? 500,
  );
  return rows.map(toProduct);
}

export async function getProduct(slug: string) {
  const row = await first<Row>("SELECT * FROM products WHERE slug = ? AND published = 1", slug);
  return row ? toProduct(row) : null;
}

export async function getProductById(id: string) {
  const row = await first<Row>("SELECT * FROM products WHERE id = ?", id);
  return row ? toProduct(row) : null;
}

export async function listReviews(productId: string, viewer?: { id: string; isAdmin: boolean } | null) {
  const rows = await all<Row>(
    `SELECT r.*, u.display_name AS author_name, u.avatar_url AS author_avatar
       FROM reviews r LEFT JOIN users u ON u.id = r.user_id
      WHERE r.product_id = ? AND (r.hidden = 0 OR r.user_id = ? OR ? = 1)
      ORDER BY r.created_at DESC`,
    productId,
    viewer?.id ?? "",
    viewer?.isAdmin ? 1 : 0,
  );
  return rows.map((r) => ({ ...(r as unknown as Review), hidden: bool(r.hidden), verified: bool(r.verified), author: author(r) }));
}

/** Has this user bought this product (and not been refunded)? */
export async function hasPurchased(productId: string, userId: string) {
  const row = await first<{ ok: number }>(
    `SELECT 1 AS ok FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE oi.product_id = ? AND o.user_id = ? AND o.status IN ('paid', 'shipped') LIMIT 1`,
    productId,
    userId,
  );
  return !!row;
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
export async function listOrders(opts: { userId?: string; limit?: number } = {}): Promise<Order[]> {
  const orders = await all<Row>(
    `SELECT * FROM orders ${opts.userId ? "WHERE user_id = ?" : ""} ORDER BY created_at DESC LIMIT ?`,
    ...(opts.userId ? [opts.userId] : []),
    opts.limit ?? 200,
  );
  if (!orders.length) return [];

  const ids = orders.map((o) => String(o.id));
  const items = await all<OrderItem>(
    `SELECT * FROM order_items WHERE order_id IN (${ids.map(() => "?").join(",")})`,
    ...ids,
  );
  return orders.map((o) => ({
    ...(o as unknown as Order),
    shipping: parseJson(o.shipping, null),
    order_items: items.filter((i) => i.order_id === o.id),
  }));
}
