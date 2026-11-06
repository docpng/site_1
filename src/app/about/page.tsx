import type { Metadata } from "next";
import { Markdown } from "@/components/Markdown";
import { PageHeader } from "@/components/PageHeader";
import { text } from "@/lib/content";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const settings = await getSettings();
  return (
    <div className="container-page max-w-3xl py-14">
      <PageHeader title={text(settings, "about_title")} banner={text(settings, "about_banner_url")} />
      <Markdown source={settings.about_markdown} />
    </div>
  );
}
