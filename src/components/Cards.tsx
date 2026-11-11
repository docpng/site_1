import Link from "next/link";
import { formatDate, formatPrice, kindLabel } from "@/lib/format";
import type { Post, Product, Project } from "@/lib/types";

function Cover({ src, alt }: { src: string | null; alt: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="aspect-[16/9] w-full rounded-t-xl object-cover" />
  ) : (
    <div className="aspect-[16/9] w-full rounded-t-xl bg-gradient-to-br from-brand-100 via-brand-50 to-white" aria-hidden />
  );
}

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.slug}`} className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      <Cover src={project.cover_url} alt={project.title} />
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-semibold text-ink group-hover:text-brand-700">{project.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm text-muted">{project.summary}</p>
        {project.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.tags.slice(0, 4).map((t) => (
              <span key={t} className="badge">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="card group flex flex-col p-5 transition hover:border-brand-200 hover:shadow-md">
      <p className="text-xs font-medium tracking-wide text-brand-600 uppercase">{formatDate(post.published_at ?? post.created_at)}</p>
      <h3 className="mt-2 text-lg font-semibold text-ink group-hover:text-brand-700">{post.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm text-muted">{post.excerpt}</p>
    </Link>
  );
}

export function ProductCard({ product, currency }: { product: Product; currency: string }) {
  return (
    <Link href={`/shop/${product.slug}`} className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      <Cover src={product.images[0] ?? null} alt={product.title} />
      <div className="flex flex-1 flex-col p-5">
        <span className="text-xs font-medium text-muted">{kindLabel[product.kind]}</span>
        <h3 className="mt-1 font-semibold text-ink group-hover:text-brand-700">{product.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted">{product.summary}</p>
        <p className="mt-auto pt-4 font-semibold text-brand-700">
          {product.kind === "free" ? "Free" : formatPrice(product.price_cents, currency)}
        </p>
      </div>
    </Link>
  );
}

export function FeaturedPostCard({ post, label, cta }: { post: Post; label: string; cta: string }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="card group grid overflow-hidden transition hover:shadow-md md:grid-cols-[1.15fr_1fr]"
    >
      {post.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover_url} alt="" className="aspect-[16/10] h-full w-full object-cover md:aspect-auto" />
      ) : (
        <div className="aspect-[16/10] h-full w-full bg-gradient-to-br from-brand-600 via-brand-500 to-brand-300 md:aspect-auto" aria-hidden />
      )}
      <div className="flex flex-col justify-center p-6 sm:p-10">
        <span className="badge self-start">{label}</span>
        <p className="mt-4 text-xs font-medium tracking-wide text-brand-600 uppercase">{formatDate(post.published_at ?? post.created_at)}</p>
        <h3 className="mt-2 text-2xl font-bold tracking-tight text-ink group-hover:text-brand-700 sm:text-3xl">{post.title}</h3>
        {post.excerpt && <p className="mt-3 line-clamp-4 text-slate-600">{post.excerpt}</p>}
        <span className="mt-6 text-sm font-semibold text-brand-700">{cta}</span>
      </div>
    </Link>
  );
}
