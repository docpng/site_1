"use client";

import { useRef, useState } from "react";
import { uploadMedia } from "@/lib/upload";

/** A single image URL (e.g. a cover), with upload. */
export function ImageField({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string | null }) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      setUrl(await uploadMedia(file, name.includes("logo") || name.includes("favicon") ? "branding" : "covers"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex gap-4">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-24 w-36 rounded-lg border border-line object-cover" />
        ) : (
          <div className="flex h-24 w-36 items-center justify-center rounded-lg border border-dashed border-brand-200 bg-brand-50/50 text-xs text-muted">
            No image
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2">
          <input name={name} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… or upload" className="input" />
          <div className="flex gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="btn-secondary py-1.5">
              {busy ? "Uploading…" : "Upload"}
            </button>
            {url && (
              <button type="button" onClick={() => setUrl("")} className="btn py-1.5 text-muted hover:text-red-600">
                Remove
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
