import { test } from "node:test";
import assert from "node:assert/strict";
import { sniffImageType } from "./imageType.js";

/** Minimal but structurally valid headers for each accepted format. */
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
const GIF = Buffer.from("GIF89a", "ascii");
const WEBP = Buffer.concat([
  Buffer.from("RIFF", "ascii"),
  Buffer.from([0x24, 0x00, 0x00, 0x00]),
  Buffer.from("WEBP", "ascii"),
  Buffer.from("VP8 ", "ascii"),
]);

test("detects each supported image format from its magic bytes", () => {
  assert.equal(sniffImageType(JPEG)?.format, "jpeg");
  assert.equal(sniffImageType(PNG)?.format, "png");
  assert.equal(sniffImageType(GIF)?.format, "gif");
  assert.equal(sniffImageType(WEBP)?.format, "webp");
});

test("reports the matching MIME type", () => {
  assert.equal(sniffImageType(PNG)?.mime, "image/png");
  assert.equal(sniffImageType(JPEG)?.mime, "image/jpeg");
});

test("rejects non-images regardless of a spoofable file extension", () => {
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  const html = Buffer.from("<!doctype html><script>alert(1)</script>");
  const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
  const elf = Buffer.from([0x7f, 0x45, 0x4c, 0x46]);

  for (const buffer of [svg, html, zip, elf]) {
    assert.equal(sniffImageType(buffer), null);
  }
});

test("does not misidentify a RIFF container that is not WebP", () => {
  const wav = Buffer.concat([
    Buffer.from("RIFF", "ascii"),
    Buffer.from([0x24, 0x00, 0x00, 0x00]),
    Buffer.from("WAVE", "ascii"),
  ]);
  assert.equal(sniffImageType(wav), null);
});

test("handles empty and truncated input without throwing", () => {
  assert.equal(sniffImageType(Buffer.alloc(0)), null);
  assert.equal(sniffImageType(Buffer.from([0xff])), null);
  assert.equal(sniffImageType(Buffer.from([0xff, 0xd8])), null);
});
