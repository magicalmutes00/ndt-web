import { z } from "zod";

/**
 * The single source of truth for every editable piece of site content.
 *
 * This module is imported by BOTH the browser bundle and the API server, so the
 * runtime validator and the TypeScript type can never drift apart. Anything the
 * admin dashboard can change must be described here.
 */

export const CONTENT_VERSION = 1 as const;

export const ROUTE_KEYS = [
  "/",
  "/about",
  "/courses",
  "/services",
  "/placements",
  "/gallery",
  "/testimonials",
  "/contact",
  "/apply",
  "/privacy",
  "/terms",
] as const;

export type RouteKey = (typeof ROUTE_KEYS)[number];

/** Lucide icon names the admin may choose from. See src/components/ui/Icon.tsx. */
export const ICON_NAMES = [
  "waves",
  "radioactive",
  "droplets",
  "magnet",
  "eye",
  "zap",
  "award",
  "briefcase",
  "graduation-cap",
  "microscope",
  "users",
  "building",
  "clock",
  "certificate",
  "hard-drive",
  "book-open",
  "wrench",
  "shield",
  "target",
  "globe",
  "check",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

const iconSchema = z.enum(ICON_NAMES);

/** Text that shows up as a heading, label or chip. Trimmed and length-bounded. */
const line = (max = 160) => z.string().trim().min(1).max(max);
const optionalLine = (max = 160) => z.string().trim().max(max).optional();
const paragraph = (max = 2000) => z.string().trim().min(1).max(max);

/**
 * Only Google Maps embed URLs are accepted for the map iframe, because this
 * value becomes an `src` attribute. Without this guard an admin (or an attacker
 * with a session) could inject an arbitrary frame.
 */
const mapEmbedSchema = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (value) =>
      value === "" ||
      /^https:\/\/www\.google\.com\/maps(\/embed)?\?/.test(value) ||
      /^https:\/\/maps\.google\.com\//.test(value),
    { message: "Must be a https://www.google.com/maps embed URL" }
  );

export const addressSchema = z.object({
  line1: line(),
  line2: optionalLine(),
  city: line(80),
  state: line(80),
  pincode: line(20),
  country: line(80),
  full: paragraph(400),
});

export const settingsSchema = z.object({
  name: line(60),
  fullName: line(120),
  tagline: line(120),
  description: paragraph(400),
  domain: line(120)
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, "Must be a bare domain, e.g. example.com"),
  email: z.string().trim().email().max(160),
  emailAlt: z.union([z.literal(""), z.string().trim().email().max(160)]),
  phone: line(40),
  phoneAlt: optionalLine(40),
  phoneLandline: optionalLine(40),
  whatsapp: z
    .union([z.literal(""), z.string().trim().url().max(500)])
    .refine(
      (value) => value === "" || /^https:\/\/wa\.me\/\d+/.test(value),
      { message: "Must be a https://wa.me/<number> link" }
    ),
  address: addressSchema,
  mapEmbed: mapEmbedSchema,
  yearsExperience: z.number().int().min(0).max(200),
});

export const navLinkSchema = z.object({
  label: line(40),
  path: line(120),
});

export const navSchema = z.object({
  links: z.array(navLinkSchema).max(12),
});

export const socialLinkSchema = z.object({
  name: line(40),
  url: z.string().trim().url().max(500),
  icon: z.enum(["youtube", "facebook", "instagram", "linkedin", "x"]),
});

export const footerColumnSchema = z.object({
  title: line(60),
  items: z.array(z.object({ label: line(60), path: line(120) })).max(10),
});

export const footerSchema = z.object({
  blurb: paragraph(400),
  social: z.array(socialLinkSchema).max(8),
  columns: z.array(footerColumnSchema).max(4),
});

export const seoSchema = z.object({
  title: line(120),
  description: paragraph(400),
  image: optionalLine(200),
});

export const courseSchema = z.object({
  id: line(60).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes"),
  code: line(12),
  name: line(80),
  description: paragraph(600),
  duration: line(40),
  certification: line(60),
  icon: iconSchema,
  topics: z.array(line(120)).max(24),
});

export const serviceSchema = z.object({
  id: line(60).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes"),
  title: line(120),
  description: paragraph(600),
  features: z.array(line(120)).max(24),
  icon: iconSchema,
});

export const statSchema = z.object({
  label: line(60),
  value: z.number().min(0).max(1_000_000),
  suffix: optionalLine(8),
  prefix: optionalLine(8),
  icon: iconSchema,
});

export const testimonialSchema = z.object({
  id: line(60),
  name: line(80),
  role: line(80),
  avatar: z.union([z.literal(""), z.string().trim().url().max(500)]),
  content: paragraph(1200),
  rating: z.number().int().min(1).max(5),
});

export const galleryItemSchema = z.object({
  id: line(60),
  src: line(500),
  category: line(40),
  title: line(120),
  alt: z.string().trim().max(200).optional(),
});

export const whyChooseUsSchema = z.object({
  title: line(80),
  description: paragraph(400),
  icon: iconSchema,
});

export const collectionsSchema = z.object({
  courses: z.array(courseSchema).max(40),
  services: z.array(serviceSchema).max(20),
  stats: z.array(statSchema).max(8),
  testimonials: z.array(testimonialSchema).max(60),
  gallery: z.array(galleryItemSchema).max(200),
  specialties: z.array(line(120)).max(20),
  whyChooseUs: z.array(whyChooseUsSchema).max(8),
  /** Chips listed under the placement blurb. */
  placementCountries: z.array(line(60)).max(20),
  /** Accreditation badges shown on the about page, e.g. "ISO". */
  certifications: z.array(line(20)).max(10),
});

export const siteContentSchema = z.object({
  version: z.literal(CONTENT_VERSION),
  settings: settingsSchema,
  nav: navSchema,
  footer: footerSchema,
  seo: z.record(z.enum(ROUTE_KEYS), seoSchema),
  collections: collectionsSchema,
});

export type SiteSettings = z.infer<typeof settingsSchema>;
export type NavLink = z.infer<typeof navLinkSchema>;
export type SocialLink = z.infer<typeof socialLinkSchema>;
export type FooterColumn = z.infer<typeof footerColumnSchema>;
export type SeoEntry = z.infer<typeof seoSchema>;
export type Course = z.infer<typeof courseSchema>;
export type Service = z.infer<typeof serviceSchema>;
export type Stat = z.infer<typeof statSchema>;
export type Testimonial = z.infer<typeof testimonialSchema>;
export type GalleryItem = z.infer<typeof galleryItemSchema>;
export type WhyChooseUs = z.infer<typeof whyChooseUsSchema>;
export type Collections = z.infer<typeof collectionsSchema>;
export type SiteContent = z.infer<typeof siteContentSchema>;

/** Flattens a ZodError into `{ "settings.email": "Invalid email" }` for the UI. */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!out[path]) out[path] = issue.message;
  }
  return out;
}
