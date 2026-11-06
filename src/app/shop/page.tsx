import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/Cards";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { text, type ContentKey } from "@/lib/content";
import { getSettings, listProducts } from "@/lib/data";

export const metadata: Metadata = { title: "Shop" };

const FILTERS: { value: string; label: ContentKey }[] = [
  { value: "", label: "shop_filter_all" },
  { value: "digital", label: "shop_filter_digital" },
  { value: "physical", label: "shop_filter_physical" },
  { value: "free", label: "shop_filter_free" },
];

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const { kind } = await searchParams;
  const active = typeof kind === "string" && FILTERS.some((f) => f.value === kind) ? kind : "";
  const [settings, products] = await Promise.all([getSettings(), listProducts({ kind: active || undefined })]);

  return (
    <div className="container-page py-14">
      <PageHeader title={text(settings, "shop_title")} intro={text(settings, "shop_intro")} banner={text(settings, "shop_banner_url")} />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/shop?kind=${f.value}` : "/shop"}
            className={`rounded-full border px-3 py-1 text-sm ${
              f.value === active ? "border-brand-600 bg-brand-600 text-white" : "border-line text-slate-600 hover:border-brand-300 hover:text-brand-700"
            }`}
          >
            {text(settings, f.label)}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        {products.length === 0 ? (
          <EmptyState title={text(settings, "shop_empty")} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} currency={settings.currency} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
