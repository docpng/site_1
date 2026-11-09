import { AdminList } from "@/components/admin/AdminList";
import { formatPrice, kindLabel } from "@/lib/format";
import { getSettings } from "@/lib/data";
import { toProduct } from "@/lib/data";
import { all } from "@/lib/db";

export default async function AdminProducts() {
  const [rows, settings] = await Promise.all([
    all<Record<string, unknown>>("SELECT * FROM products ORDER BY sort_order, created_at DESC"),
    getSettings(),
  ]);
  const data = rows.map(toProduct);
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
