import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Cloudflare bindings and vars for the current request. */
export function env() {
  return getCloudflareContext().env;
}

/** The D1 database binding. */
export function db() {
  return env().DB;
}

/** The R2 bucket holding images (media/...) and product files (downloads/...). */
export function files() {
  return env().FILES;
}

type Param = string | number | null;

export async function all<T>(sql: string, ...params: Param[]): Promise<T[]> {
  const { results } = await db().prepare(sql).bind(...params).all<T>();
  return results;
}

export async function first<T>(sql: string, ...params: Param[]): Promise<T | null> {
  return db().prepare(sql).bind(...params).first<T>();
}

export async function run(sql: string, ...params: Param[]) {
  return db().prepare(sql).bind(...params).run();
}

export function newId() {
  return crypto.randomUUID();
}

export function now() {
  return new Date().toISOString();
}

/** JSON array column -> string[] */
export function parseList(value: unknown): string[] {
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/** SQLite unique-constraint violation (e.g. duplicate slug). */
export function isUniqueViolation(err: unknown) {
  return err instanceof Error && /UNIQUE constraint failed/i.test(err.message);
}

export function isCheckViolation(err: unknown) {
  return err instanceof Error && /CHECK constraint failed/i.test(err.message);
}
