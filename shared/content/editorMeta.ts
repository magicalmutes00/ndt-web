/**
 * Presentation metadata for the admin forms.
 *
 * The dashboard walks `SiteContent` and looks up each field's label and widget
 * kind here. Adding a field to the schema plus one entry here is all it takes to
 * get a working form control — no bespoke JSX per field.
 *
 * Lookup works by longest matching path prefix:
 *   "settings.email"        -> exact entry wins
 *   "collections.courses[].name" -> the entry for every course object
 */

export type FieldKind =
  | "text"
  | "textarea"
  | "email"
  | "tel"
  | "url"
  | "number"
  | "icon"
  | "image"
  | "select"
  /** array of plain strings, e.g. course topics */
  | "string-list"
  /** array of flat objects, e.g. gallery items */
  | "object-list";

export interface FieldMeta {
  label: string;
  kind: FieldKind;
  help?: string;
  placeholder?: string;
  /** Renders full width in the two-column form grid. */
  wide?: boolean;
  /** Hides the field from the UI while keeping it in the data model. */
  hidden?: boolean;
  /** For object-list: shown as each row's heading. */
  rowTitle?: string;
  /** For object-list: fields that may not be removed from a row. */
  rowKeys?: string[];
}

export const fieldMeta: Record<string, FieldMeta> = {
  // ---------------------------------------------------------------- settings
  "settings.name": { label: "Short name", kind: "text", help: "Used in the navigation bar and page titles." },
  "settings.fullName": { label: "Full name", kind: "text" },
  "settings.tagline": { label: "Tagline", kind: "text" },
  "settings.description": { label: "Site description", kind: "textarea", wide: true, help: "Default meta description used when a page has none." },
  "settings.domain": { label: "Domain", kind: "text", placeholder: "example.com", help: "Bare host, no https://. Drives canonical URLs and sitemap links." },
  "settings.email": { label: "Primary email", kind: "email" },
  "settings.emailAlt": { label: "Secondary email", kind: "email" },
  "settings.phone": { label: "Primary phone", kind: "tel" },
  "settings.phoneAlt": { label: "Secondary phone", kind: "tel" },
  "settings.phoneLandline": { label: "Landline", kind: "tel" },
  "settings.whatsapp": { label: "WhatsApp link", kind: "url", wide: true, placeholder: "https://wa.me/919000000001", help: "Must start with https://wa.me/" },
  "settings.address.line1": { label: "Address line 1", kind: "text" },
  "settings.address.line2": { label: "Address line 2", kind: "text" },
  "settings.address.city": { label: "City", kind: "text" },
  "settings.address.state": { label: "State", kind: "text" },
  "settings.address.pincode": { label: "Postal code", kind: "text" },
  "settings.address.country": { label: "Country", kind: "text" },
  "settings.address.full": { label: "Full address (one line)", kind: "textarea", wide: true, help: "Shown in the footer and contact page." },
  "settings.mapEmbed": { label: "Google Maps embed URL", kind: "url", wide: true, help: "Only google.com/maps URLs are accepted." },
  "settings.yearsExperience": { label: "Years of experience", kind: "number" },

  // --------------------------------------------------------------------- nav
  "nav.links": { label: "Navigation links", kind: "object-list", rowTitle: "label", rowKeys: ["label", "path"] },
  "nav.links[].label": { label: "Label", kind: "text" },
  "nav.links[].path": { label: "Path", kind: "text", placeholder: "/about" },

  // ------------------------------------------------------------------ footer
  "footer.blurb": { label: "Footer description", kind: "textarea", wide: true },
  "footer.social": { label: "Social links", kind: "object-list", rowKeys: ["name", "url", "icon"] },
  "footer.social[].name": { label: "Name", kind: "text" },
  "footer.social[].url": { label: "URL", kind: "url" },
  "footer.social[].icon": { label: "Icon", kind: "select" },
  "footer.columns": { label: "Footer columns", kind: "object-list", rowTitle: "title", rowKeys: ["title", "items"] },
  "footer.columns[].title": { label: "Column title", kind: "text" },
  "footer.columns[].items": { label: "Links", kind: "object-list", rowTitle: "label" },
  "footer.columns[].items[].label": { label: "Label", kind: "text" },
  "footer.columns[].items[].path": { label: "Path", kind: "text" },

  // --------------------------------------------------------------------- seo
  "seo": { label: "Search engine listing", kind: "object-list" },
  "seo.title": { label: "Page title", kind: "text" },
  "seo.description": { label: "Meta description", kind: "textarea", wide: true },
  "seo.image": { label: "Social share image", kind: "image", help: "Absolute URL or path under /public." },

  // ------------------------------------------------------------- collections
  "collections.courses": { label: "Courses", kind: "object-list", rowTitle: "name", rowKeys: ["id", "code", "name"] },
  "collections.courses[].id": { label: "ID", kind: "text", help: "Lowercase, dashes only. Used as the URL anchor." },
  "collections.courses[].code": { label: "Code", kind: "text", placeholder: "UT" },
  "collections.courses[].name": { label: "Name", kind: "text" },
  "collections.courses[].description": { label: "Description", kind: "textarea", wide: true },
  "collections.courses[].duration": { label: "Duration", kind: "text" },
  "collections.courses[].certification": { label: "Certification", kind: "text" },
  "collections.courses[].icon": { label: "Icon", kind: "icon" },
  "collections.courses[].topics": { label: "Topics", kind: "string-list" },

  "collections.services": { label: "Services", kind: "object-list", rowTitle: "title", rowKeys: ["id", "title"] },
  "collections.services[].id": { label: "ID", kind: "text" },
  "collections.services[].title": { label: "Title", kind: "text" },
  "collections.services[].description": { label: "Description", kind: "textarea", wide: true },
  "collections.services[].features": { label: "Features", kind: "string-list" },
  "collections.services[].icon": { label: "Icon", kind: "icon" },

  "collections.stats": { label: "Counters", kind: "object-list", rowTitle: "label", rowKeys: ["label", "value"] },
  "collections.stats[].label": { label: "Label", kind: "text" },
  "collections.stats[].value": { label: "Value", kind: "number" },
  "collections.stats[].suffix": { label: "Suffix", kind: "text", placeholder: "+" },
  "collections.stats[].prefix": { label: "Prefix", kind: "text" },
  "collections.stats[].icon": { label: "Icon", kind: "icon" },

  "collections.testimonials": { label: "Testimonials", kind: "object-list", rowTitle: "name", rowKeys: ["id", "name"] },
  "collections.testimonials[].id": { label: "ID", kind: "text" },
  "collections.testimonials[].name": { label: "Student name", kind: "text" },
  "collections.testimonials[].role": { label: "Role", kind: "text" },
  "collections.testimonials[].avatar": { label: "Photo", kind: "image" },
  "collections.testimonials[].content": { label: "Quote", kind: "textarea", wide: true },
  "collections.testimonials[].rating": { label: "Rating (1-5)", kind: "number" },

  "collections.gallery": { label: "Gallery images", kind: "object-list", rowTitle: "title", rowKeys: ["id", "src"] },
  "collections.gallery[].id": { label: "ID", kind: "text" },
  "collections.gallery[].src": { label: "Image", kind: "image" },
  "collections.gallery[].category": { label: "Category", kind: "text", help: "Gallery filter chips are built from these values." },
  "collections.gallery[].title": { label: "Caption", kind: "text" },
  "collections.gallery[].alt": { label: "Alt text", kind: "text", wide: true, help: "Describes the image for screen readers." },

  "collections.specialties": { label: "Specialties", kind: "string-list" },

  "collections.placementCountries": {
    label: "Placement countries",
    kind: "string-list",
    help: "Shown as chips beneath the placement summary.",
  },

  "collections.certifications": {
    label: "Accreditation badges",
    kind: "string-list",
    help: 'Short labels such as "ISO" — rendered as "<label> Certified".',
  },

  "collections.whyChooseUs": { label: "Why choose us", kind: "object-list", rowTitle: "title", rowKeys: ["title"] },
  "collections.whyChooseUs[].title": { label: "Title", kind: "text" },
  "collections.whyChooseUs[].description": { label: "Description", kind: "textarea", wide: true },
  "collections.whyChooseUs[].icon": { label: "Icon", kind: "icon" },
};

/** Falls back to a humanised key so a brand-new schema field is still usable. */
export function metaFor(path: string): FieldMeta {
  const exact = fieldMeta[path];
  if (exact) return exact;

  // Parent-list lookup: "collections.courses[].name" -> "collections.courses".
  // Its `kind` tells the form renderer whether the parent is an object list.
  const separator = path.indexOf("[]");
  if (separator > 0) {
    const parent = fieldMeta[path.slice(0, separator)];
    if (parent?.kind === "object-list") {
      return { label: parent.label, kind: "object-list", rowTitle: parent.rowTitle, rowKeys: parent.rowKeys };
    }
  }

  const last = path.split(".").pop() ?? path;
  return {
    label: last
      .replace(/\[\]/g, "")
      .replace(/[A-Z]/g, (c) => ` ${c}`)
      .replace(/^./, (c) => c.toUpperCase()),
    kind: "text",
  };
}

/** Sections rendered as tabs in the dashboard. */
export const editorSections = [
  { id: "settings", label: "Business details", path: "settings" },
  { id: "nav", label: "Navigation", path: "nav" },
  { id: "footer", label: "Footer", path: "footer" },
  { id: "seo", label: "SEO", path: "seo" },
  { id: "courses", label: "Courses", path: "collections.courses" },
  { id: "services", label: "Services", path: "collections.services" },
  { id: "stats", label: "Counters", path: "collections.stats" },
  { id: "testimonials", label: "Testimonials", path: "collections.testimonials" },
  { id: "gallery", label: "Gallery", path: "collections.gallery" },
  { id: "specialties", label: "Specialties", path: "collections.specialties" },
  { id: "placementCountries", label: "Placement countries", path: "collections.placementCountries" },
  { id: "certifications", label: "Accreditation badges", path: "collections.certifications" },
  { id: "whyChooseUs", label: "Why choose us", path: "collections.whyChooseUs" },
] as const;

export type EditorSection = (typeof editorSections)[number];

export const socialIconOptions = ["youtube", "facebook", "instagram", "linkedin", "x"] as const;
