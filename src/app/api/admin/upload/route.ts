import { getCurrentUser } from "@/lib/auth";
import { files } from "@/lib/db";

const MAX_BYTES = 95 * 1024 * 1024; // Workers accept request bodies up to 100 MB on the Free/Pro plans.
const FOLDERS = new Set(["uploads", "covers", "products", "content", "branding"]);

function safeName(name: string) {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "file";
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  return ext ? `${base}.${ext}` : base;
}

/** Admin-only upload into R2. Images go under media/ (public), product files under downloads/ (private). */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.profile.is_admin) return Response.json({ error: "Not allowed" }, { status: 403 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return Response.json({ error: "No file received" }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Files are limited to 95 MB" }, { status: 413 });

  const kind = form.get("kind") === "download" ? "download" : "media";
  const folder = FOLDERS.has(String(form.get("folder"))) ? String(form.get("folder")) : "uploads";
  if (kind === "media" && !file.type.startsWith("image/")) {
    return Response.json({ error: "Only images can be uploaded here" }, { status: 400 });
  }

  const key = `${kind === "media" ? "media" : "downloads"}/${folder}/${Date.now()}-${safeName(file.name)}`;
  await files().put(key, file.stream(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
    customMetadata: { originalName: file.name.slice(0, 200) },
  });

  return kind === "media" ? Response.json({ url: `/files/${key}` }) : Response.json({ key });
}
