import { saveSettings } from "@/app/actions/admin";
import { AdminForm, Field, TextArea, Toggle } from "@/components/admin/AdminForm";
import { ImageField } from "@/components/admin/ImageField";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { CONTENT_SECTIONS, type ContentField, type ContentKey } from "@/lib/content";
import { getSettings } from "@/lib/data";
import type { SiteSettings } from "@/lib/types";

export default async function SettingsPage() {
  const s = await getSettings();
  const nav = [{ id: "general", title: "General" }, ...CONTENT_SECTIONS.map(({ id, title }) => ({ id, title }))];

  return (
    <div>
      <h1 className="text-2xl font-bold">Site settings</h1>
      <p className="mt-1 text-sm text-muted">
        Edit your logo, images and the wording on every page. Leave a text field blank to use the default shown in grey.
      </p>

      <nav className="sticky top-16 z-10 -mx-1 mt-6 flex gap-1 overflow-x-auto border-b border-line bg-white/95 px-1 py-2 backdrop-blur">
        {nav.map((n) => (
          <a key={n.id} href={`#${n.id}`} className="rounded-md px-2.5 py-1 text-sm whitespace-nowrap text-slate-600 hover:bg-brand-50 hover:text-brand-700">
            {n.title}
          </a>
        ))}
      </nav>

      <div className="mt-6">
        <AdminForm action={saveSettings} submitLabel="Save all settings">
          <Section id="general" title="General">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Site name" name="site_name" defaultValue={s.site_name} required />
              <Field label="Tagline" name="tagline" defaultValue={s.tagline} help="Shown above the homepage headline and in search results." />
            </div>
            <Field label="Homepage headline" name="hero_title" defaultValue={s.hero_title} />
            <TextArea label="Homepage intro" name="hero_subtitle" defaultValue={s.hero_subtitle} />
            <MarkdownEditor name="about_markdown" label="About page text" defaultValue={s.about_markdown} rows={14} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Footer text" name="footer_text" defaultValue={s.footer_text} />
              <Field label="Shop currency" name="currency" defaultValue={s.currency} maxLength={3} help="Three-letter code, e.g. usd, eur, gbp." />
            </div>
            <TextArea
              label="Social links"
              name="social_links"
              rows={4}
              defaultValue={s.social_links.map((l) => `${l.label} | ${l.url}`).join("\n")}
              help="One per line: Label | https://url"
            />
          </Section>

          {CONTENT_SECTIONS.map((section) => (
            <Section key={section.id} id={section.id} title={section.title} description={"description" in section ? section.description : undefined}>
              <ContentFields fields={section.fields} settings={s} />
            </Section>
          ))}
        </AdminForm>
      </div>
    </div>
  );
}

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-32 space-y-4 p-6">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function ContentFields({ fields, settings }: { fields: readonly ContentField[]; settings: SiteSettings }) {
  const images = fields.filter((f) => f.type === "image" || f.type === "toggle");
  const texts = fields.filter((f) => f.type !== "image" && f.type !== "toggle");
  const saved = (key: string) => settings.content?.[key as ContentKey] ?? "";

  return (
    <>
      {images.map((f) =>
        f.type === "image" ? (
          <div key={f.key}>
            <ImageField name={`content.${f.key}`} label={f.label} defaultValue={saved(f.key)} />
            {f.help && <p className="mt-1 text-xs text-muted">{f.help}</p>}
          </div>
        ) : (
          <Toggle key={f.key} label={f.label} name={`content.${f.key}`} defaultChecked={(saved(f.key) || f.default) !== "false"} />
        ),
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {texts.map((f) =>
          f.type === "textarea" ? (
            <div key={f.key} className="sm:col-span-2">
              <label className="label" htmlFor={f.key}>{f.label}</label>
              <textarea id={f.key} name={`content.${f.key}`} defaultValue={saved(f.key)} placeholder={f.default} rows={2} className="input" />
              {f.help && <p className="mt-1 text-xs text-muted">{f.help}</p>}
            </div>
          ) : (
            <div key={f.key}>
              <label className="label" htmlFor={f.key}>{f.label}</label>
              <input id={f.key} name={`content.${f.key}`} defaultValue={saved(f.key)} placeholder={f.default} className="input" />
              {f.help && <p className="mt-1 text-xs text-muted">{f.help}</p>}
            </div>
          ),
        )}
      </div>
    </>
  );
}
