import Link from "next/link";
import { text } from "@/lib/content";
import { getSettings } from "@/lib/data";

export async function Footer() {
  const settings = await getSettings();
  return (
    <footer className="mt-24 border-t border-line bg-brand-50/50">
      <div className="container-page flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 font-semibold text-ink">
            {text(settings, "logo_url") && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={text(settings, "logo_url")} alt="" className="h-6 w-auto max-w-28 object-contain" />
            )}
            {settings.site_name}
          </p>
          <p className="mt-1 text-sm text-muted">{settings.footer_text || settings.tagline}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          {settings.social_links.map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-brand-700">
              {l.label}
            </a>
          ))}
          <Link href="/blog" className="text-slate-600 hover:text-brand-700">
            Blog
          </Link>
          <Link href="/shop" className="text-slate-600 hover:text-brand-700">
            Shop
          </Link>
        </div>
      </div>
      <p className="container-page pb-8 text-xs text-muted">
        © {new Date().getFullYear()} {settings.site_name}
      </p>
    </footer>
  );
}
