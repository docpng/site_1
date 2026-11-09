import Link from "next/link";
import { FeaturedPostCard, PostCard, ProductCard, ProjectCard } from "@/components/Cards";
import { Carousel } from "@/components/Carousel";
import { flag, text } from "@/lib/content";
import { getSettings, listPosts, listProducts, listProjects } from "@/lib/data";

export default async function HomePage() {
  const [settings, featuredProjects, allProjects, featuredPosts, posts, featuredProducts, latestProducts] = await Promise.all([
    getSettings(),
    listProjects({ featured: true, limit: 12 }),
    listProjects({ limit: 12 }),
    // Featured posts/products need migration 0002; fall back gracefully if it hasn't run yet.
    orEmpty(listPosts({ featured: true, limit: 1 })),
    listPosts({ limit: 4 }),
    orEmpty(listProducts({ featured: true, limit: 12 })),
    listProducts({ limit: 12 }),
  ]);
  const projects = featuredProjects.length ? featuredProjects : allProjects;
  const products = featuredProducts.length ? featuredProducts : latestProducts;
  // The big spot: newest featured post, or the newest post if none is featured.
  const featuredPost = featuredPosts[0] ?? posts[0];
  const recentPosts = posts.filter((p) => p.id !== featuredPost?.id).slice(0, 3);
  const autoAdvance = flag(settings, "home_autoscroll");
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

      {featuredPost && (
        <section className="container-page mt-16">
          <FeaturedPostCard post={featuredPost} label={text(settings, "home_featured_post_label")} cta={text(settings, "home_read_more")} />
        </section>
      )}

      <Section title={text(settings, "home_projects_title")} viewAll={viewAll} href="/projects" show={projects.length > 0}>
        <Carousel label={text(settings, "home_projects_title")} autoAdvance={autoAdvance}>
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </Carousel>
      </Section>

      <Section title={text(settings, "home_blog_title")} viewAll={viewAll} href="/blog" show={recentPosts.length > 0}>
        <div className="grid gap-6 md:grid-cols-3">
          {recentPosts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      </Section>

      <Section title={text(settings, "home_shop_title")} viewAll={viewAll} href="/shop" show={products.length > 0}>
        <Carousel label={text(settings, "home_shop_title")} autoAdvance={autoAdvance}>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} currency={settings.currency} />
          ))}
        </Carousel>
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

async function orEmpty<T>(promise: Promise<T[]>): Promise<T[]> {
  try {
    return await promise;
  } catch (err) {
    console.error(err);
    return [];
  }
}
