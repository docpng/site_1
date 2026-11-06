"use client";

import { useRef, useState } from "react";
import { uploadMedia } from "@/lib/upload";

/** An ordered list of image URLs (product photos). The first image is the cover. */
export function GalleryField({ name, label, defaultValue = [] }: { name: string; label: string; defaultValue?: string[] }) {
  const [urls, setUrls] = useState<string[]>(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      const uploaded: string[] = [];
      for (const f of Array.from(files)) uploaded.push(await uploadMedia(f, "products"));
      setUrls((u) => [...u, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const move = (i: number, d: number) =>
    setUrls((u) => {
      const next = [...u];
      const j = i + d;
      if (j < 0 || j >= next.length) return u;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div>
      <span className="label">{label}</span>
      <input type="hidden" name={name} value={JSON.stringify(urls)} />
      <div className="flex flex-wrap gap-3">
        {urls.map((u, i) => (
          <div key={u + i} className="group relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" className="h-24 w-24 rounded-lg border border-line object-cover" />
            {i === 0 && <span className="badge absolute top-1 left-1">Cover</span>}
            <div className="absolute inset-x-1 bottom-1 hidden justify-between rounded bg-white/90 px-1 text-xs group-hover:flex">
              <button type="button" onClick={() => move(i, -1)} aria-label="Move left">←</button>
              <button type="button" onClick={() => setUrls((x) => x.filter((_, k) => k !== i))} className="text-red-600">
                ✕
              </button>
              <button type="button" onClick={() => move(i, 1)} aria-label="Move right">→</button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-brand-300 text-sm text-brand-700 hover:bg-brand-50"
        >
          {busy ? "…" : "+ Add"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
