"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type FormState = { ok?: boolean; error?: string } | undefined;

export async function addComment(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in to comment." };

  const postId = String(formData.get("post_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const parentId = String(formData.get("parent_id") ?? "") || null;
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Comment can't be empty." };
  if (body.length > 5000) return { error: "Comments are limited to 5,000 characters." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("comments")
    .insert({ post_id: postId, parent_id: parentId, body, user_id: user.id });
  if (error) return { error: "Couldn't post your comment. Please try again." };

  revalidatePath(`/blog/${slug}`);
  return { ok: true };
}

export async function deleteComment(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const supabase = await createClient();
  // RLS only allows deleting your own comment (or any comment for admins).
  await supabase.from("comments").delete().eq("id", String(formData.get("id")));
  revalidatePath(`/blog/${String(formData.get("slug"))}`);
}

export async function saveReview(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in to leave a review." };

  const productId = String(formData.get("product_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const rating = Number(formData.get("rating"));
  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  const body = String(formData.get("body") ?? "").trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: "Pick a rating from 1 to 5 stars." };
  if (body.length > 5000) return { error: "Reviews are limited to 5,000 characters." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .upsert({ product_id: productId, user_id: user.id, rating, title, body }, { onConflict: "product_id,user_id" });
  if (error) return { error: "Couldn't save your review. Please try again." };

  revalidatePath(`/shop/${slug}`);
  return { ok: true };
}

export async function deleteReview(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const supabase = await createClient();
  await supabase.from("reviews").delete().eq("id", String(formData.get("id")));
  revalidatePath(`/shop/${String(formData.get("slug"))}`);
}

export async function updateDisplayName(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in." };
  const name = String(formData.get("display_name") ?? "").trim().slice(0, 60);
  if (!name) return { error: "Name can't be empty." };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", user.id);
  if (error) return { error: "Couldn't update your name." };
  revalidatePath("/account");
  return { ok: true };
}
