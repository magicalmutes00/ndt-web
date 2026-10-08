import type { SiteContent } from "../../shared/content/schema.js";

/**
 * Minimal dot-path accessors for the editor tabs.
 *
 * The content document is nested (`collections.courses`, `settings.address`),
 * so reading/writing a tab's slice by path keeps the tab definition a plain
 * string instead of bespoke accessor code per tab.
 */

export function getByPath(root: unknown, path: string): unknown {
  if (!path) return root;
  return path.split(".").reduce<unknown>((accumulator, key) => {
    if (accumulator && typeof accumulator === "object") {
      return (accumulator as Record<string, unknown>)[key];
    }
    return undefined;
  }, root);
}

/**
 * Returns a new document with `next` written at `path`. Never mutates the input,
 * so React state comparisons stay cheap and predictable.
 */
export function setByPath<T>(root: T, path: string, next: unknown): T {
  const keys = path.split(".");
  const clone: unknown = Array.isArray(root) ? [...(root as unknown[])] : { ...(root as object) };

  let cursor = clone as Record<string, unknown>;
  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index];
    const child = cursor[key];
    cursor[key] = Array.isArray(child) ? [...child] : { ...(child as object) };
    cursor = cursor[key] as Record<string, unknown>;
  }

  cursor[keys[keys.length - 1]] = next;
  return clone as T;
}

/** Structural comparison used for the "unsaved changes" indicator. */
export function documentsMatch(a: SiteContent, b: SiteContent): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
