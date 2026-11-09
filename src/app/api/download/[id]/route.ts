import { getCurrentUser } from "@/lib/auth";
import { getProductById, hasPurchased } from "@/lib/data";
import { files } from "@/lib/db";

/**
 * Streams a product's file from R2.
 * Free products: anyone (if published). Digital products: buyers and admins only.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/download/[id]">) {
  const { id } = await ctx.params;
  const product = await getProductById(id);
  if (!product?.file_key || product.kind === "physical") return new Response("Not found", { status: 404 });

  const user = await getCurrentUser();
  const isAdmin = !!user?.profile.is_admin;
  if (!product.published && !isAdmin) return new Response("Not found", { status: 404 });

  if (product.kind === "digital" && !isAdmin) {
    if (!user) {
      const next = encodeURIComponent(`/shop/${product.slug}`);
      return Response.redirect(new URL(`/login?next=${next}`, request.url), 303);
    }
    if (!(await hasPurchased(product.id, user.id))) {
      return new Response("You haven't purchased this item.", { status: 403 });
    }
  }

  const object = await files().get(product.file_key);
  if (!object) return new Response("File unavailable", { status: 404 });

  const name = (product.file_name || product.file_key.split("/").pop() || "download").replace(/["\r\n]/g, "");
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("content-disposition", `attachment; filename="${name.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(name)}`);
  headers.set("content-length", String(object.size));
  headers.set("cache-control", "private, no-store");
  return new Response(object.body, { headers });
}
