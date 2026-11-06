import { AdminList } from "@/components/admin/AdminList";
import { formatPrice, kindLabel } from "@/lib/format";
import { getSettings } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

export default async function AdminProducts() {
  const supabase = await createClient();
  const [{ data }, settings] = await Promise.all([
    supabase.from("products").select("*").order("sort_order").order("created_at", { ascending: false }).returns<Product[]>(),
    getSettings(),
  ]);
  return (
    <AdminList
      title="Products & downloads"
      newHref="/admin/products/new"
      rows={(data ?? []).map((p) => ({
        id: p.id,
        href: `/admin/products/${p.id}`,
        viewHref: `/shop/${p.slug}`,
        title: p.title,
        meta: `${kindLabel[p.kind]} · ${p.kind === "free" ? "Free" : formatPrice(p.price_cents, settings.currency)}${
          p.kind === "physical" && p.stock !== null ? ` · ${p.stock} in stock` : ""
        }`,
        published: p.published,
      }))}
    />
  );
}
