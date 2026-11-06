import Link from "next/link";
import { PostCard, ProductCard, ProjectCard } from "@/components/Cards";
import { getSettings, listPosts, listProducts, listProjects } from "@/lib/data";

export default async function HomePage() {
  const [settings, featured, allProjects, posts, products] = await Promise.all([
    getSettings(),
    listProjects({ featured: true, limit: 6 }),
    listProjects({ limit: 6 }),
    listPosts({ limit: 3 }),
    listProducts({ limit: 3 }),
  ]);
  const projects = featured.length ? featured : allProjects;

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-brand-50 to-white">
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" aria-hidden />
        <div className="container-page relative py-20 sm:py-28">
          <p className="badge">{settings.tagline}</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-ink sm:text-5xl">{settings.hero_title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-600">{settings.hero_subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/projects" className="btn-primary px-5 py-2.5">
              Explore projects
            </Link>
            <Link href="/shop" className="btn-secondary px-5 py-2.5">
              Visit the shop
            </Link>
          </div>
        </div>
      </section>

      <Section title="Projects" href="/projects" show={projects.length > 0}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </Section>

      <Section title="Latest from the blog" href="/blog" show={posts.length > 0}>
        <div className="grid gap-6 md:grid-cols-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      </Section>

      <Section title="From the shop" href="/shop" show={products.length > 0}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} currency={settings.currency} />
          ))}
        </div>
      </Section>
    </>
  );
}

function Section({ title, href, show, children }: { title: string; href: string; show: boolean; children: React.ReactNode }) {
  if (!show) return null;
  return (
    <section className="container-page mt-16">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="text-2xl font-bold text-ink">{title}</h2>
        <Link href={href} className="text-sm font-medium text-brand-700 hover:underline">
          View all →
        </Link>
      </div>
      {children}
    </section>
  );
}
