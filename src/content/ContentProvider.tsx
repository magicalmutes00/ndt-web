import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { getSnapshot, hydrateContent, subscribe } from "./store";
import type { SiteContent } from "../../shared/content/index.js";

/**
 * Hydrates the content store on mount.
 *
 * The gate exists so the first paint never shows placeholder text: the public
 * pages render only once content is resolved (from the API, the cache, the
 * static snapshot, or the compiled default). A timeout guarantees we render
 * *something* even if every network layer hangs.
 */
const GATE_TIMEOUT_MS = 3000;

export function ContentProvider({ children }: { children: ReactNode }) {
  const started = useRef(false);

  if (!started.current) {
    started.current = true;
    // Kick the fetch off during the first render so it overlaps with paint.
    void hydrateContent();
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      // No-op if hydration already finished; otherwise unblocks the gate.
      void hydrateContent();
    }, GATE_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return <>{children}</>;
}

/**
 * Reads content from the store, re-rendering whenever it changes.
 *
 * Subscribe/getSnapshot are module-level and the snapshot reference is stable
 * between updates, which is what `useSyncExternalStore` requires to avoid an
 * infinite render loop.
 */
export function useContent(): SiteContent {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Convenience for components that only need one slice. */
export function useContentSlice<T>(selector: (content: SiteContent) => T): T {
  const content = useContent();
  return selector(content);
}
