import {
  defaultContent,
  siteContentSchema,
  type SiteContent,
} from "../../shared/content/index.js";
import { api } from "../lib/api.js";

/**
 * The public site's content store.
 *
 * Four-layer resolution, so the site renders complete content even when the API
 * or the database is unreachable:
 *
 *   1. live `/api/content` (revalidated with ETag)
 *   2. last response cached in localStorage
 *   3. `public/content.json` emitted on every publish
 *   4. the compiled default bundled with the app
 *
 * The store is module-level and read through `useSyncExternalStore`, so a single
 * hydrate call re-renders every consumer without prop drilling.
 */

const CACHE_KEY = "ndt.content.v1";
const ETAG_KEY = "ndt.content.etag.v1";

export type ContentSource = "api" | "cache" | "static" | "default" | "revalidated";

let current: SiteContent = defaultContent;
let source: ContentSource = "default";
let isHydrated = false;
let inflight: Promise<SiteContent> | null = null;

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Stable reference between updates — required by useSyncExternalStore. */
export function getSnapshot(): SiteContent {
  return current;
}

export function getContentSource(): ContentSource {
  return source;
}

export function isContentHydrated(): boolean {
  return isHydrated;
}

function setContent(next: SiteContent, nextSource: ContentSource): void {
  current = next;
  source = nextSource;
  isHydrated = true;
  emit();
}

function readCached(): SiteContent | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = siteContentSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function writeCache(doc: SiteContent, etag: string | null): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(doc));
    if (etag) localStorage.setItem(ETAG_KEY, etag);
  } catch {
    // Private mode or a full quota — the in-memory copy still works.
  }
}

function readEtag(): string | null {
  try {
    return localStorage.getItem(ETAG_KEY);
  } catch {
    return null;
  }
}

/** Loads `public/content.json` — the layer that survives an API outage. */
async function fetchStaticSnapshot(): Promise<SiteContent | null> {
  try {
    const response = await fetch("/content.json", { cache: "no-cache" });
    if (!response.ok) return null;
    const parsed = siteContentSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

interface ContentResponseMeta {
  version: number;
  updatedAt: string;
  source: string;
  etag: string;
}

/**
 * Fetches the published content, validating it before it can replace what we
 * already have. A schema mismatch is treated as "no update" rather than
 * blanking the site.
 */
export async function hydrateContent(options: { force?: boolean } = {}): Promise<SiteContent> {
  if (inflight && !options.force) return inflight;

  inflight = (async () => {
    // Show cached content immediately so there is no placeholder flash, then
    // revalidate against the API.
    if (!isHydrated) {
      const cached = readCached();
      if (cached) setContent(cached, "cache");
    }

    try {
      const meta = await api.get<ContentResponseMeta>("/api/content/meta");
      const etag = readEtag();
      if (!options.force && etag && etag === meta.etag && isHydrated) {
        source = "revalidated";
        return current;
      }

      const raw = await api.get<unknown>("/api/content");
      const parsed = siteContentSchema.safeParse(raw);
      if (!parsed.success) {
        console.error("[content] API returned content that failed validation");
        return current;
      }

      setContent(parsed.data, "api");
      writeCache(parsed.data, meta.etag);
      return parsed.data;
    } catch (error) {
      console.warn(
        "[content] live fetch failed, continuing with cached content:",
        error instanceof Error ? error.message : error
      );
    }

    if (source !== "cache" && source !== "api") {
      const staticSnapshot = await fetchStaticSnapshot();
      if (staticSnapshot) {
        setContent(staticSnapshot, "static");
        return staticSnapshot;
      }
    }

    isHydrated = true;
    emit();
    return current;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}

/** Used by the dashboard after a publish so the admin sees their own change. */
export function applyContent(doc: SiteContent): void {
  setContent(doc, "api");
  writeCache(doc, null);
}
