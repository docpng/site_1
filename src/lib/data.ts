import "server-only";
import { cache } from "react";
import { createClient } from "./supabase/server";
import type { Comment, Post, Product, Project, Review, SiteSettings } from "./types";

const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  site_name: "My Site",
  tagline: "Projects, products and notes from the workshop.",
  hero_title: "Things I build, and how I build them.",
  hero_subtitle: "A home for my projects, products and a running log of what I make.",
  about_markdown: "",
  footer_text: "",
  social_links: [],
  currency: "usd",
  content: {},
  updated_at: new Date(0).toISOString(),
};

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle<SiteSettings>();
  // Spread over the defaults so the site still works before a new migration is run.
  return { ...DEFAULT_SETTINGS, ...(data ?? {}), content: data?.content ?? {} };
});

// ---------- Projects ----------
export async function listProjects(opts: { featured?: boolean; limit?: number } = {}) {
  const supabase = await createClient();
  let q = supabase
    .from("projects")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (opts.featured) q = q.eq("featured", true);
  if (opts.limit) q = q.limit(opts.limit);
  const { data } = await q.returns<Project[]>();
  return data ?? [];
}

export async function getProject(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle<Project>();
  return data;
}

// ---------- Posts ----------
export async function listPosts(opts: { limit?: number; projectId?: string; tag?: string } = {}) {
  const supabase = await createClient();
  let q = supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false, nullsFirst: false });
  if (opts.projectId) q = q.eq("project_id", opts.projectId);
  if (opts.tag) q = q.contains("tags", [opts.tag]);
  if (opts.limit) q = q.limit(opts.limit);
  const { data } = await q.returns<Post[]>();
  return data ?? [];
}

export async function getPost(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle<Post>();
  return data;
}

export async function listComments(postId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comments")
    .select("*, author:profiles(display_name, avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .returns<Comment[]>();
  return data ?? [];
}

// ---------- Products ----------
export async function listProducts(opts: { kind?: string; projectId?: string; limit?: number } = {}) {
  const supabase = await createClient();
  let q = supabase
    .from("products")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (opts.kind) q = q.eq("kind", opts.kind);
  if (opts.projectId) q = q.eq("project_id", opts.projectId);
  if (opts.limit) q = q.limit(opts.limit);
  const { data } = await q.returns<Product[]>();
  return data ?? [];
}

export async function getProduct(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle<Product>();
  return data;
}

export async function listReviews(productId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*, author:profiles(display_name, avatar_url)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .returns<Review[]>();
  return data ?? [];
}

export async function hasPurchased(productId: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("has_purchased", { p_product_id: productId });
  return data === true;
}
