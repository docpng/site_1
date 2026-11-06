import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentSection } from "@/components/CommentSection";
import { Markdown } from "@/components/Markdown";
import { text } from "@/lib/content";
import { getPost, getSettings } from "@/lib/data";
import { formatDate } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = await getPost((await params).slug);
  return post ? { title: post.title, description: post.excerpt } : {};
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([getPost(slug), getSettings()]);
  if (!post) notFound();

  return (
    <article className="container-page max-w-3xl py-14">
      <Link href="/blog" className="text-sm text-brand-700 hover:underline">
        {text(settings, "blog_back")}
      </Link>
      <p className="mt-6 text-sm font-medium text-brand-600">{formatDate(post.published_at ?? post.created_at)}</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">{post.title}</h1>
      {post.excerpt && <p className="mt-3 text-lg text-slate-600">{post.excerpt}</p>}
      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`} className="badge hover:bg-brand-100">
              {t}
            </Link>
          ))}
        </div>
      )}
      {post.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover_url} alt="" className="mt-10 w-full rounded-2xl border border-line" />
      )}
      <Markdown source={post.body} className="mt-10" />

      <CommentSection postId={post.id} slug={post.slug} />
    </article>
  );
}
