import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { Markdown } from "@/components/Markdown";
import { ReviewSection } from "@/components/ReviewSection";
import { getCurrentUser } from "@/lib/auth";
import { text } from "@/lib/content";
import { getProduct, getSettings, hasPurchased } from "@/lib/data";
import { formatPrice, kindLabel } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  return product ? { title: product.title, description: product.summary } : {};
}

export default async function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()]);
  const owned = user && product.kind === "digital" ? await hasPurchased(product.id, user.id) : false;
  const [cover, ...rest] = product.images;

  return (
    <div className="container-page py-14">
      <Link href="/shop" className="text-sm text-brand-700 hover:underline">
        {text(settings, "shop_back")}
      </Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="space-y-3">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={product.title} className="w-full rounded-2xl border border-line" />
          ) : (
            <div className="aspect-square w-full rounded-2xl bg-gradient-to-br from-brand-100 via-brand-50 to-white" />
          )}
          {rest.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {rest.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt="" className="aspect-square w-full rounded-lg border border-line object-cover" />
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="badge">{kindLabel[product.kind]}</span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{product.title}</h1>
          <p className="mt-3 text-lg text-slate-600">{product.summary}</p>
          <p className="mt-6 text-3xl font-bold text-brand-700">
            {product.kind === "free" ? "Free" : formatPrice(product.price_cents, settings.currency)}
          </p>
          {product.kind === "physical" && product.stock !== null && product.stock > 0 && (
            <p className="mt-1 text-sm text-muted">{product.stock} in stock</p>
          )}

          <div className="mt-6">
            {product.kind === "free" ? (
              product.file_key ? (
                <a href={`/api/download/${product.id}`} className="btn-primary px-6 py-2.5">
                  {text(settings, "free_download")}
                  {product.file_name ? ` ${product.file_name}` : ""}
                </a>
              ) : (
                <p className="text-sm text-muted">Download coming soon.</p>
              )
            ) : owned ? (
              <div className="flex flex-wrap items-center gap-3">
                <a href={`/api/download/${product.id}`} className="btn-primary px-6 py-2.5">
                  {text(settings, "owned_download")}
                </a>
                <span className="text-sm text-muted">You own this.</span>
              </div>
            ) : (
              <AddToCart product={product} labels={{ add: text(settings, "add_to_cart"), soldOut: text(settings, "sold_out") }} />
            )}
          </div>

          <Markdown source={product.description} className="mt-10" />
        </div>
      </div>

      <ReviewSection productId={product.id} slug={product.slug} />
    </div>
  );
}
