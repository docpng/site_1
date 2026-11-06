import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/Cards";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { text } from "@/lib/content";
import { getSettings, listPosts } from "@/lib/data";

export const metadata: Metadata = { title: "Blog" };

export default async function BlogPage({ searchParams }: PageProps<"/blog">) {
  const { tag } = await searchParams;
  const activeTag = typeof tag === "string" ? tag : undefined;
  const [settings, posts, all] = await Promise.all([getSettings(), listPosts({ tag: activeTag }), listPosts()]);
  const tags = [...new Set(all.flatMap((p) => p.tags))].sort();

  return (
    <div className="container-page py-14">
      <PageHeader title={text(settings, "blog_title")} intro={text(settings, "blog_intro")} banner={text(settings, "blog_banner_url")} />

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <TagLink href="/blog" active={!activeTag} label={text(settings, "blog_all_tags")} />
          {tags.map((t) => (
            <TagLink key={t} href={`/blog?tag=${encodeURIComponent(t)}`} active={t === activeTag} label={t} />
          ))}
        </div>
      )}

      <div className="mt-8">
        {posts.length === 0 ? (
          <EmptyState title={text(settings, "blog_empty")} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TagLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-sm ${
        active ? "border-brand-600 bg-brand-600 text-white" : "border-line text-slate-600 hover:border-brand-300 hover:text-brand-700"
      }`}
    >
      {label}
    </Link>
  );
}
