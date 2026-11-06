"use client";

import { marked } from "marked";
import { useMemo, useRef, useState } from "react";
import { uploadMedia } from "@/lib/upload";

type Props = { name: string; label: string; defaultValue?: string; rows?: number; help?: string };

const TOOLS: { label: string; title: string; before: string; after?: string; block?: boolean }[] = [
  { label: "B", title: "Bold", before: "**", after: "**" },
  { label: "I", title: "Italic", before: "_", after: "_" },
  { label: "H2", title: "Heading", before: "## ", block: true },
  { label: "H3", title: "Subheading", before: "### ", block: true },
  { label: "•", title: "Bulleted list", before: "- ", block: true },
  { label: "1.", title: "Numbered list", before: "1. ", block: true },
  { label: "❝", title: "Quote", before: "> ", block: true },
  { label: "</>", title: "Code", before: "`", after: "`" },
  { label: "Link", title: "Link", before: "[", after: "](https://)" },
];

/** Markdown editor with toolbar, live preview, and drag-or-click image upload. */
export function MarkdownEditor({ name, label, defaultValue = "", rows = 18, help }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [tab, setTab] = useState<"write" | "preview" | "split">("split");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const html = useMemo(() => marked.parse(value, { async: false }), [value]);

  const insert = (before: string, after = "", block = false) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const selected = value.slice(s, e);
    const prefix = block && s > 0 && value[s - 1] !== "\n" ? "\n" : "";
    const next = value.slice(0, s) + prefix + before + selected + after + value.slice(e);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = s + prefix.length + before.length + selected.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const url = await uploadMedia(file, "content");
        insert(`![${file.name.replace(/\.[^.]+$/, "")}](${url})`, "", true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="label mb-0">{label}</span>
        <div className="flex rounded-lg border border-line p-0.5 text-xs">
          {(["write", "split", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-md px-2.5 py-1 capitalize ${tab === t ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-brand-50"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      {help && <p className="mb-2 text-xs text-muted">{help}</p>}

      <div className="overflow-hidden rounded-lg border border-line focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
        <div className="flex flex-wrap items-center gap-1 border-b border-line bg-brand-50/50 px-2 py-1.5">
          {TOOLS.map((t) => (
            <button
              key={t.title}
              type="button"
              title={t.title}
              onClick={() => insert(t.before, t.after, t.block)}
              className="rounded px-2 py-1 font-mono text-xs text-slate-700 hover:bg-white hover:text-brand-700"
            >
              {t.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="ml-auto rounded px-2 py-1 text-xs font-medium text-brand-700 hover:bg-white"
          >
            {uploading ? "Uploading…" : "+ Image"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
        </div>

        <div className={tab === "split" ? "grid lg:grid-cols-2" : ""}>
          <textarea
            ref={ref}
            name={name}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onDrop={(e) => {
              if (e.dataTransfer.files.length) {
                e.preventDefault();
                upload(e.dataTransfer.files);
              }
            }}
            onPaste={(e) => {
              if (e.clipboardData.files.length) {
                e.preventDefault();
                upload(e.clipboardData.files);
              }
            }}
            rows={rows}
            className={`w-full resize-y border-0 p-3 font-mono text-sm focus:outline-none ${tab === "preview" ? "hidden" : ""}`}
            placeholder="Write in Markdown. Drag, paste or upload images."
          />
          {tab !== "write" && (
            <div
              className={`prose-site max-h-[640px] overflow-auto p-4 ${tab === "split" ? "hidden border-l border-line lg:block" : ""}`}
              dangerouslySetInnerHTML={{ __html: html || "<p class='text-slate-400'>Nothing to preview yet.</p>" }}
            />
          )}
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
