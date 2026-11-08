"use client";

type UploadResult = { url?: string; key?: string; error?: string };

async function upload(file: File, kind: "media" | "download", folder: string): Promise<UploadResult> {
  const body = new FormData();
  body.set("file", file);
  body.set("kind", kind);
  body.set("folder", folder);
  const res = await fetch("/api/admin/upload", { method: "POST", body });
  const data = (await res.json().catch(() => ({}))) as UploadResult;
  if (!res.ok) throw new Error(data.error ?? `Upload failed (${res.status})`);
  return data;
}

/** Uploads a public image and returns its URL (served from /files/media/...). */
export async function uploadMedia(file: File, folder = "uploads") {
  const { url } = await upload(file, "media", folder);
  return url!;
}

/** Uploads a private product file and returns its storage key. */
export async function uploadDownload(file: File) {
  const { key } = await upload(file, "download", "products");
  return key!;
}
