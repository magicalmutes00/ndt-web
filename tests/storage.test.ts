import { test } from "node:test";
import assert from "node:assert/strict";
import { config, isS3Configured } from "../server/src/env.js";
import { createS3Provider } from "../server/src/storage/s3.js";
import { extensionForContentType, safeBaseName } from "../server/src/storage/provider.js";
import { sniffImageType } from "../server/src/media/imageType.js";

/**
 * Storage contract tests.
 *
 * The pure helpers always run. The live S3 round-trip only runs when
 * AWS_* / S3_BUCKET are configured, so a bare checkout still passes.
 */

const describeLive = isS3Configured ? test : test.skip;

/** A 1x1 transparent PNG. */
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
  "base64"
);

test("extensionForContentType maps only the formats we allow", () => {
  assert.equal(extensionForContentType("image/jpeg"), "jpg");
  assert.equal(extensionForContentType("image/png"), "png");
  assert.equal(extensionForContentType("image/webp"), "webp");
  assert.equal(extensionForContentType("image/gif"), "gif");
  // Anything else is deliberately not a real image extension.
  assert.equal(extensionForContentType("text/html"), "bin");
  assert.equal(extensionForContentType("application/x-msdownload"), "bin");
});

test("safeBaseName cannot escape the upload folder", () => {
  assert.equal(safeBaseName("../../etc/passwd"), "passwd");
  assert.equal(safeBaseName("..\\..\\windows\\system32\\cmd.exe"), "cmd");
  assert.equal(safeBaseName("/absolute/path/photo.jpg"), "photo");
  assert.equal(safeBaseName("my photo (1).jpeg"), "my-photo-1");
  // Degenerate input still yields a usable name.
  assert.equal(safeBaseName("...."), "upload");
  assert.equal(safeBaseName(""), "upload");
  // Bounded length.
  assert.ok(safeBaseName("a".repeat(500)).length <= 60);
});

test("the fixture is a real PNG by magic bytes", () => {
  assert.equal(sniffImageType(PNG_1X1)?.format, "png");
});

describeLive("a presigned PUT is browser-usable", async () => {
  const provider = createS3Provider();
  const presigned = await provider.createPresignedUpload({
    filename: "test image.png",
    contentType: "image/png",
  });

  assert.match(presigned.key, /^uploads\/test-image-[0-9a-f-]{36}\.png$/);
  assert.equal(presigned.headers["Content-Type"], "image/png");
  assert.ok(presigned.expiresInSeconds > 0);

  const url = new URL(presigned.uploadUrl);
  assert.equal(url.host, new URL(config.s3.endpoint!).host);

  // A browser <form>/fetch PUT cannot send these, and AWS SDK v3 began attaching
  // a CRC32 checksum to presigned URLs by default — which breaks that PUT. If
  // this assertion fails, browser uploads silently start returning 403.
  const signedHeaders = url.searchParams.get("X-Amz-SignedHeaders") ?? "";
  assert.ok(
    !signedHeaders.includes("x-amz-checksum"),
    `presigned URL requires a checksum header the browser cannot send: ${signedHeaders}`
  );
  assert.ok(
    !url.searchParams.has("x-amz-checksum-crc32"),
    "presigned URL carries an inline checksum parameter"
  );
});

describeLive("upload, head, confirm and delete round-trip against the bucket", async () => {
  const provider = createS3Provider();
  const presigned = await provider.createPresignedUpload({
    filename: "roundtrip.png",
    contentType: "image/png",
  });

  // 1. PUT exactly as a browser would: raw body, only the signed header.
  const put = await fetch(presigned.uploadUrl, {
    method: "PUT",
    body: PNG_1X1,
    headers: presigned.headers,
  });
  assert.equal(put.status, 200, `PUT failed with ${put.status}: ${await put.text()}`);

  // 2. head — this is what /api/media/confirm relies on.
  const head = await provider.headObject(presigned.key);
  assert.ok(head, "expected the uploaded object to be readable");
  assert.equal(head.bytes, PNG_1X1.length);
  assert.equal(head.contentType, "image/png");

  // 3. confirm produces a durable, non-expiring proxy URL.
  const object = await provider.confirmUpload(presigned.key);
  assert.ok(object);
  assert.equal(object.url, `/api/media/file/${presigned.key}`);
  assert.equal(object.format, "png");
  // A private bucket must never hand back a presigned URL for embedding.
  assert.ok(!object.secureUrl.includes("X-Amz-Signature"));

  // 4. an anonymous read of the raw object must still fail (bucket stays private)
  const anon = await fetch(`${config.s3.endpoint}/${config.s3.bucket}/${presigned.key}`);
  assert.equal(anon.status, 403, "bucket is expected to remain private");

  // 5. cleanup
  assert.equal(await provider.deleteObject(presigned.key), true);
  assert.equal(await provider.headObject(presigned.key), null);
});

describeLive("headObject reports null for a missing object rather than throwing", async () => {
  const provider = createS3Provider();
  const missing = await provider.headObject(`uploads/does-not-exist-${Date.now()}.png`);
  assert.equal(missing, null);
});
