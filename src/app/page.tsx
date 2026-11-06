import Link from "next/link";
import { PostCard, ProductCard, ProjectCard } from "@/components/Cards";
import { text } from "@/lib/content";
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
  const heroImage = text(settings, "hero_image_url");
  const viewAll = text(settings, "home_view_all");

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-brand-50 to-white">
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" aria-hidden />
        <div className={`container-page relative py-20 sm:py-28 ${heroImage ? "grid items-center gap-12 lg:grid-cols-2" : ""}`}>
          <div>
            <p className="badge">{settings.tagline}</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-ink sm:text-5xl">{settings.hero_title}</h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-600">{settings.hero_subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={text(settings, "home_cta_primary_href")} className="btn-primary px-5 py-2.5">
                {text(settings, "home_cta_primary")}
              </Link>
              <Link href={text(settings, "home_cta_secondary_href")} className="btn-secondary px-5 py-2.5">
                {text(settings, "home_cta_secondary")}
              </Link>
            </div>
          </div>
          {heroImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroImage} alt="" className="w-full rounded-2xl border border-line shadow-lg" />
          )}
        </div>
      </section>

      <Section title={text(settings, "home_projects_title")} viewAll={viewAll} href="/projects" show={projects.length > 0}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </Section>

      <Section title={text(settings, "home_blog_title")} viewAll={viewAll} href="/blog" show={posts.length > 0}>
        <div className="grid gap-6 md:grid-cols-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      </Section>

      <Section title={text(settings, "home_shop_title")} viewAll={viewAll} href="/shop" show={products.length > 0}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} currency={settings.currency} />
          ))}
        </div>
      </Section>
    </>
  );
}

function Section({ title, viewAll, href, show, children }: { title: string; viewAll: string; href: string; show: boolean; children: React.ReactNode }) {
  if (!show) return null;
  return (
    <section className="container-page mt-16">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="text-2xl font-bold text-ink">{title}</h2>
        <Link href={href} className="text-sm font-medium text-brand-700 hover:underline">
          {viewAll}
        </Link>
      </div>
      {children}
    </section>
  );
}
