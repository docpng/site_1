import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Reads a Worker secret or variable (set with `wrangler secret put`, in the
 * Cloudflare dashboard, or in .dev.vars locally), falling back to process.env.
 */
export function secret(name: string): string | undefined {
  let value: unknown;
  try {
    value = (getCloudflareContext().env as unknown as Record<string, unknown>)[name];
  } catch {
    // Outside a request (e.g. at build time).
  }
  if (typeof value === "string" && value) return value;
  return process.env[name] || undefined;
}

export function adminEmails(): string[] {
  return (secret("ADMIN_EMAILS") ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
