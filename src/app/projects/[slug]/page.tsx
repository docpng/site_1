import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostCard, ProductCard } from "@/components/Cards";
import { Markdown } from "@/components/Markdown";
import { getProject, getSettings, listPosts, listProducts } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const project = await getProject((await params).slug);
  return project ? { title: project.title, description: project.summary } : {};
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const [settings, posts, products] = await Promise.all([
    getSettings(),
    listPosts({ projectId: project.id }),
    listProducts({ projectId: project.id }),
  ]);

  return (
    <article className="container-page max-w-4xl py-14">
      <div className="flex flex-wrap gap-1.5">
        {project.tags.map((t) => (
          <span key={t} className="badge">
            {t}
          </span>
        ))}
      </div>
      <h1 className="mt-4 text-4xl font-bold tracking-tight">{project.title}</h1>
      <p className="mt-3 text-lg text-slate-600">{project.summary}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        {project.live_url && (
          <a href={project.live_url} target="_blank" rel="noreferrer" className="btn-primary">
            Visit project ↗
          </a>
        )}
        {project.repo_url && (
          <a href={project.repo_url} target="_blank" rel="noreferrer" className="btn-secondary">
            Source code ↗
          </a>
        )}
      </div>
      {project.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={project.cover_url} alt="" className="mt-10 w-full rounded-2xl border border-line" />
      )}
      <Markdown source={project.body} className="mt-10" />

      {products.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">Get it</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} currency={settings.currency} />
            ))}
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">Build log</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
