import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

/**
 * Hands out a short-lived signed URL for a product's file.
 * Free products: anyone. Digital products: only signed-in buyers (or admins).
 */
export async function GET(request: Request, ctx: RouteContext<"/api/download/[id]">) {
  const { id } = await ctx.params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("id, slug, kind, file_path, file_name, published")
    .eq("id", id)
    .maybeSingle<Pick<Product, "id" | "slug" | "kind" | "file_path" | "file_name" | "published">>();

  if (!product?.file_path || product.kind === "physical") {
    return new Response("Not found", { status: 404 });
  }

  if (product.kind === "digital") {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const next = encodeURIComponent(`/shop/${product.slug}`);
      return Response.redirect(new URL(`/login?next=${next}`, request.url), 303);
    }
    const [{ data: owned }, { data: profile }] = await Promise.all([
      supabase.rpc("has_purchased", { p_product_id: product.id }),
      supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle(),
    ]);
    if (!owned && !profile?.is_admin) return new Response("You haven't purchased this item.", { status: 403 });
  }

  const { data, error } = await createAdminClient()
    .storage.from("downloads")
    .createSignedUrl(product.file_path, 60, { download: product.file_name ?? true });
  if (error || !data) return new Response("File unavailable", { status: 500 });

  return Response.redirect(data.signedUrl, 302);
}
