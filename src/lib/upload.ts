"use client";

import { createClient } from "@/lib/supabase/client";

function safeName(name: string) {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "file";
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  return ext ? `${base}.${ext}` : base;
}

/** Uploads to the public "media" bucket and returns the public URL. */
export async function uploadMedia(file: File, folder = "uploads") {
  const supabase = createClient();
  const path = `${folder}/${Date.now()}-${safeName(file.name)}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}

/** Uploads to the private "downloads" bucket and returns the object path. */
export async function uploadDownload(file: File) {
  const supabase = createClient();
  const path = `products/${Date.now()}-${safeName(file.name)}`;
  const { error } = await supabase.storage.from("downloads").upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw error;
  return path;
}
