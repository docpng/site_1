import { saveSettings } from "@/app/actions/admin";
import { AdminForm, Field, TextArea } from "@/components/admin/AdminForm";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { getSettings } from "@/lib/data";

export default async function SettingsPage() {
  const s = await getSettings();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Site settings</h1>
      <AdminForm action={saveSettings}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Site name" name="site_name" defaultValue={s.site_name} required />
          <Field label="Tagline" name="tagline" defaultValue={s.tagline} />
        </div>
        <Field label="Homepage headline" name="hero_title" defaultValue={s.hero_title} />
        <TextArea label="Homepage intro" name="hero_subtitle" defaultValue={s.hero_subtitle} />
        <MarkdownEditor name="about_markdown" label="About page" defaultValue={s.about_markdown} rows={14} />
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
      </AdminForm>
    </div>
  );
}
