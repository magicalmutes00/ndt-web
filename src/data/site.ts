/**
 * @deprecated Superseded by `shared/content/defaultContent.ts`.
 *
 * Content is now a single Zod-validated document served by the API and edited in
 * the admin dashboard. This module intentionally re-exports from that source
 * rather than holding its own copy, so there is no second definition to drift.
 *
 * Nothing imports it anymore — it is safe to delete this file.
 */

export { defaultContent, cloneDefaultContent } from "../../shared/content/defaultContent";
export type { SiteContent } from "../../shared/content/schema";
