import type { Metadata } from "next";
import { Markdown } from "@/components/Markdown";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const settings = await getSettings();
  return (
    <div className="container-page max-w-3xl py-14">
      <h1 className="text-3xl font-bold">About</h1>
      <Markdown source={settings.about_markdown} className="mt-8" />
    </div>
  );
}
