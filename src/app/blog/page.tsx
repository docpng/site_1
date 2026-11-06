import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/Cards";
import { EmptyState } from "@/components/EmptyState";
import { listPosts } from "@/lib/data";

export const metadata: Metadata = { title: "Blog" };

export default async function BlogPage({ searchParams }: PageProps<"/blog">) {
  const { tag } = await searchParams;
  const activeTag = typeof tag === "string" ? tag : undefined;
  const [posts, all] = await Promise.all([listPosts({ tag: activeTag }), listPosts()]);
  const tags = [...new Set(all.flatMap((p) => p.tags))].sort();

  return (
    <div className="container-page py-14">
      <h1 className="text-3xl font-bold">Blog</h1>
      <p className="mt-2 text-muted">Build logs, write-ups and notes. Sign in to join the discussion.</p>

      {tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          <TagLink href="/blog" active={!activeTag} label="All" />
          {tags.map((t) => (
            <TagLink key={t} href={`/blog?tag=${encodeURIComponent(t)}`} active={t === activeTag} label={t} />
          ))}
        </div>
      )}

      <div className="mt-8">
        {posts.length === 0 ? (
          <EmptyState title="No posts yet" />
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
