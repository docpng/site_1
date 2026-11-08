import { files } from "@/lib/db";

/** Serves public images from R2. Only keys under media/ are reachable; product files are not. */
export async function GET(request: Request, ctx: RouteContext<"/files/[...key]">) {
  const key = (await ctx.params).key.map(decodeURIComponent).join("/");
  if (!key.startsWith("media/") || key.includes("..")) return new Response("Not found", { status: 404 });

  const object = await files().get(key, { onlyIf: request.headers });
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  // Keys include an upload timestamp, so a given URL never changes content.
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("x-content-type-options", "nosniff");
  // SVGs can contain scripts; make the browser treat them as isolated documents.
  headers.set("content-security-policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox");

  if (!("body" in object) || !object.body) return new Response(null, { status: 304, headers });
  return new Response(object.body, { headers });
}
