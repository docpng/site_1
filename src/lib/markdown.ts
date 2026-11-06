import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

/**
 * Renders Markdown written by the site admin. Only admins can write Markdown
 * (visitor comments and reviews are rendered as plain text), so raw HTML is allowed.
 */
export function renderMarkdown(md: string) {
  return marked.parse(md ?? "", { async: false });
}
