/**
 * Legacy type re-exports.
 *
 * The canonical definitions now live in `shared/content/schema.ts`, where they
 * are inferred from the Zod validators the API also uses. Keeping this module as
 * a pass-through means existing `import type { Course } from "../types"` call
 * sites keep working while there is exactly one definition of each shape.
 */

export type {
  Course,
  Stat,
  Testimonial,
  Service,
  SocialLink,
  GalleryItem,
  WhyChooseUs,
  NavLink,
  SeoEntry,
  SiteContent,
  SiteSettings,
  Collections,
  RouteKey,
  IconName,
} from "../../shared/content/schema";
