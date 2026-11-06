import { renderMarkdown } from "@/lib/markdown";

export function Markdown({ source, className = "" }: { source: string; className?: string }) {
  return <div className={`prose-site ${className}`} dangerouslySetInnerHTML={{ __html: renderMarkdown(source) }} />;
}
