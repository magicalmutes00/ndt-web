/**
 * Public surface of the shared content layer.
 *
 * Explicit .js specifiers keep this resolvable from both the bundler (browser)
 * and Node's ESM resolution (server), since both graphs import this module.
 */
export * from "./schema.js";
export * from "./defaultContent.js";
export * from "./editorMeta.js";
