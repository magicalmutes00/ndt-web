import { test } from "node:test";
import assert from "node:assert/strict";
import { cloneDefaultContent, defaultContent } from "../shared/content/defaultContent.js";
import { ROUTE_KEYS, formatZodErrors, siteContentSchema } from "../shared/content/schema.js";

test("the compiled default content satisfies the schema", () => {
  const result = siteContentSchema.safeParse(defaultContent);
  if (!result.success) {
    assert.fail(`default content is invalid: ${JSON.stringify(formatZodErrors(result.error), null, 2)}`);
  }
  assert.equal(result.success, true);
});

test("cloneDefaultContent returns an independent copy", () => {
  const clone = cloneDefaultContent();
  clone.settings.name = "Mutated";
  assert.notEqual(defaultContent.settings.name, "Mutated");
  assert.equal(siteContentSchema.safeParse(defaultContent).success, true);
});

test("every route has an SEO entry", () => {
  for (const route of ROUTE_KEYS) {
    assert.ok(defaultContent.seo[route], `missing SEO entry for ${route}`);
    assert.ok(defaultContent.seo[route].title.length > 0, `empty title for ${route}`);
    assert.ok(defaultContent.seo[route].description.length > 0, `empty description for ${route}`);
  }
});

test("rejects an invalid email address", () => {
  const broken = cloneDefaultContent();
  broken.settings.email = "not-an-email";
  const result = siteContentSchema.safeParse(broken);
  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(formatZodErrors(result.error)["settings.email"]);
  }
});

test("rejects a non-Google-Maps embed URL", () => {
  const broken = cloneDefaultContent();
  broken.settings.mapEmbed = "https://evil.example.com/iframe";
  assert.equal(siteContentSchema.safeParse(broken).success, false);
});

test("accepts an empty string for the optional map embed", () => {
  const cleared = cloneDefaultContent();
  cleared.settings.mapEmbed = "";
  assert.equal(siteContentSchema.safeParse(cleared).success, true);
});

test("rejects a WhatsApp link that is not wa.me", () => {
  const broken = cloneDefaultContent();
  broken.settings.whatsapp = "https://t.me/somebody";
  assert.equal(siteContentSchema.safeParse(broken).success, false);
});

test("rejects a domain containing a scheme", () => {
  const broken = cloneDefaultContent();
  broken.settings.domain = "https://example.com";
  assert.equal(siteContentSchema.safeParse(broken).success, false);
});

test("rejects an unknown icon name", () => {
  const broken = cloneDefaultContent();
  // Bypass the type system the way bad database data would.
  (broken.collections.courses[0] as { icon: string }).icon = "definitely-not-an-icon";
  assert.equal(siteContentSchema.safeParse(broken).success, false);
});

test("rejects a rating outside 1-5", () => {
  const broken = cloneDefaultContent();
  broken.collections.testimonials[0].rating = 9;
  assert.equal(siteContentSchema.safeParse(broken).success, false);
});

test("formatZodErrors returns one message per field path", () => {
  const broken = cloneDefaultContent();
  broken.settings.email = "nope";
  broken.settings.phone = "";
  const result = siteContentSchema.safeParse(broken);
  assert.equal(result.success, false);
  if (!result.success) {
    const errors = formatZodErrors(result.error);
    assert.ok(errors["settings.email"]);
    assert.ok(errors["settings.phone"]);
  }
});
