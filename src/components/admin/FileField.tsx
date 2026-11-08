"use client";

import { useRef, useState } from "react";
import { uploadDownload } from "@/lib/upload";

/** Uploads the downloadable file for a product to the private "downloads" bucket. */
export function FileField({ defaultPath, defaultName }: { defaultPath?: string | null; defaultName?: string | null }) {
  const [path, setPath] = useState(defaultPath ?? "");
  const [fileName, setFileName] = useState(defaultName ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      setPath(await uploadDownload(file));
      setFileName(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className="label">Downloadable file</span>
      <input type="hidden" name="file_key" value={path} />
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-3">
        {path ? (
          <span className="text-sm">
            📦 <strong>{fileName || path.split("/").pop()}</strong>
          </span>
        ) : (
          <span className="text-sm text-muted">No file uploaded</span>
        )}
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="btn-secondary ml-auto py-1.5">
          {busy ? "Uploading…" : path ? "Replace file" : "Upload file"}
        </button>
        <input ref={fileRef} type="file" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
      <label className="label mt-3" htmlFor="file_name">
        File name shown to downloaders
      </label>
      <input id="file_name" name="file_name" value={fileName} onChange={(e) => setFileName(e.target.value)} className="input" />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      <p className="mt-1 text-xs text-muted">Files are private and served through short-lived links: free to anyone, paid only to buyers.</p>
    </div>
  );
}
