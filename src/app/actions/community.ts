"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { hasPurchased } from "@/lib/data";
import { first, newId, run } from "@/lib/db";

export type FormState = { ok?: boolean; error?: string } | undefined;

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export async function addComment(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in to comment." };

  const postId = str(formData, "post_id");
  const parentId = str(formData, "parent_id") || null;
  const body = str(formData, "body");
  if (!body) return { error: "Comment can't be empty." };
  if (body.length > 5000) return { error: "Comments are limited to 5,000 characters." };

  // Only published posts accept comments, and replies must belong to the same post.
  const post = await first<{ slug: string }>("SELECT slug FROM posts WHERE id = ? AND published = 1", postId);
  if (!post) return { error: "Comments are closed for this post." };
  if (parentId && !(await first("SELECT 1 FROM comments WHERE id = ? AND post_id = ?", parentId, postId))) {
    return { error: "That comment no longer exists." };
  }

  await run(
    "INSERT INTO comments (id, post_id, user_id, parent_id, body) VALUES (?, ?, ?, ?, ?)",
    newId(),
    postId,
    user.id,
    parentId,
    body,
  );
  revalidatePath(`/blog/${post.slug}`);
  return { ok: true };
}

export async function deleteComment(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const id = str(formData, "id");
  // Authors may delete their own comments; admins may delete any.
  if (user.profile.is_admin) await run("DELETE FROM comments WHERE id = ?", id);
  else await run("DELETE FROM comments WHERE id = ? AND user_id = ?", id, user.id);
  revalidatePath(`/blog/${str(formData, "slug")}`);
}

export async function saveReview(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in to leave a review." };

  const productId = str(formData, "product_id");
  const rating = Number(formData.get("rating"));
  const title = str(formData, "title").slice(0, 120);
  const body = str(formData, "body");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: "Pick a rating from 1 to 5 stars." };
  if (body.length > 5000) return { error: "Reviews are limited to 5,000 characters." };

  const product = await first<{ slug: string }>("SELECT slug FROM products WHERE id = ? AND published = 1", productId);
  if (!product) return { error: "This item is no longer available." };

  // "Verified purchase" is decided here on the server, never taken from the form.
  const verified = (await hasPurchased(productId, user.id)) ? 1 : 0;
  await run(
    `INSERT INTO reviews (id, product_id, user_id, rating, title, body, verified)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (product_id, user_id) DO UPDATE SET
       rating = excluded.rating, title = excluded.title, body = excluded.body, verified = excluded.verified`,
    newId(),
    productId,
    user.id,
    rating,
    title,
    body,
    verified,
  );
  revalidatePath(`/shop/${product.slug}`);
  return { ok: true };
}

export async function deleteReview(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const id = str(formData, "id");
  if (user.profile.is_admin) await run("DELETE FROM reviews WHERE id = ?", id);
  else await run("DELETE FROM reviews WHERE id = ? AND user_id = ?", id, user.id);
  revalidatePath(`/shop/${str(formData, "slug")}`);
}

export async function updateDisplayName(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in." };
  const name = str(formData, "display_name").slice(0, 60);
  if (!name) return { error: "Name can't be empty." };
  await run("UPDATE users SET display_name = ? WHERE id = ?", name, user.id);
  revalidatePath("/account");
  return { ok: true };
}
