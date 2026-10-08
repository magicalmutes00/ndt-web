import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  defaultContent,
  siteContentSchema,
  type SiteContent,
} from "../../../shared/content/index.js";
import { repoRoot } from "../env.js";
import { CONTENT_KEYS, getContent, seedContentIfEmpty } from "../db/repo.js";

/**
 * Owns the published document.
 *
 * A process-local copy lets `/api/content` keep serving during a brief database
 * outage (resilience layer 2 of 4), and `content.json` on disk is layer 3 for
 * clients that cannot reach the API at all.
 */

export interface PublishedSnapshot {
  doc: SiteContent;
  etag: string;
  version: number;
  updatedAt: Date;
  /** Where the document came from — useful for diagnostics and the admin banner. */
  source: "database" | "snapshot-file" | "compiled-default";
}

const SNAPSHOT_FILE = resolve(repoRoot, "public", "content.json");

let cache: PublishedSnapshot | null = null;

function computeEtag(doc: SiteContent, version: number): string {
  const digest = createHash("sha256").update(JSON.stringify(doc)).digest("hex").slice(0, 32);
  return `"v${version}-${digest}"`;
}

function makeSnapshot(
  doc: SiteContent,
  version: number,
  updatedAt: Date,
  source: PublishedSnapshot["source"]
): PublishedSnapshot {
  return { doc, etag: computeEtag(doc, version), version, updatedAt, source };
}

/**
 * Parses and validates arbitrary JSON into content. Returns null when the shape
 * is wrong, so a corrupt database row degrades to the previous layer instead of
 * breaking the site.
 */
export function parseContent(input: unknown): SiteContent | null {
  const result = siteContentSchema.safeParse(input);
  return result.success ? result.data : null;
}

async function readSnapshotFile(): Promise<SiteContent | null> {
  try {
    const raw = await readFile(SNAPSHOT_FILE, "utf8");
    return parseContent(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * Writes the published document to public/content.json so a purely static
 * deployment (or a browser that cannot reach the API) still renders fresh
 * content. Failures are logged, never fatal — the database remains the truth.
 */
export async function writeSnapshotFile(doc: SiteContent): Promise<boolean> {
  try {
    await mkdir(dirname(SNAPSHOT_FILE), { recursive: true });
    await writeFile(SNAPSHOT_FILE, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
    return true;
  } catch (error) {
    console.error(
      "[content] could not write snapshot file:",
      error instanceof Error ? error.message : error
    );
    return false;
  }
}

/** Resolves the best available content without ever throwing. */
export async function loadPublished(forceRefresh = false): Promise<PublishedSnapshot> {
  if (cache && !forceRefresh) return cache;

  try {
    const row = await getContent(CONTENT_KEYS.published);
    if (row) {
      const doc = parseContent(row.doc);
      if (doc) {
        cache = makeSnapshot(doc, row.version, row.updatedAt, "database");
        return cache;
      }
      console.error("[content] published row failed schema validation; falling back");
    }
  } catch (error) {
    console.error(
      "[content] database unavailable, falling back:",
      error instanceof Error ? error.message : error
    );
  }

  const fromFile = await readSnapshotFile();
  if (fromFile) {
    cache = makeSnapshot(fromFile, 0, new Date(0), "snapshot-file");
    return cache;
  }

  cache = makeSnapshot(defaultContent, 0, new Date(0), "compiled-default");
  return cache;
}

/** Called after any write so the next read re-queries the database. */
export function invalidatePublishedCache(): void {
  cache = null;
}

/** Seeds a fresh database and mirrors the result to disk. Safe to call at boot. */
export async function bootstrapContent(): Promise<{ seeded: boolean; snapshot: PublishedSnapshot }> {
  let seeded = false;
  try {
    seeded = await seedContentIfEmpty(defaultContent);
  } catch (error) {
    console.error(
      "[content] could not seed database:",
      error instanceof Error ? error.message : error
    );
  }

  const snapshot = await loadPublished(true);
  if (seeded) await writeSnapshotFile(snapshot.doc);
  return { seeded, snapshot };
}
