import type { FastifyInstance, FastifyReply } from "fastify";
import { requireAuth, actorEmail } from "../auth/middleware.js";
import {
  CONTENT_KEYS,
  deleteMedia,
  getContent,
  getMediaByObjectKey,
  insertMedia,
  listMedia,
} from "../db/repo.js";
import { config } from "../env.js";
import { getStorageProvider, storageProviderName } from "../storage/index.js";
import { StorageNotConfiguredError } from "../storage/provider.js";
import { CloudinaryNotConfiguredError } from "../media/cloudinary.js";
import { sniffImageType } from "../media/imageType.js";

/** Cloudinary's free tier rejects >10 MB; we cap lower for a snappy admin UX. */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Only formats we can sniff and safely serve. */
const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function replyStorageError(reply: FastifyReply, error: unknown) {
  if (error instanceof StorageNotConfiguredError || error instanceof CloudinaryNotConfiguredError) {
    return reply.code(503).send({ success: false, error: error.message });
  }
  const message = error instanceof Error ? error.message : String(error);
  return reply.code(502).send({ success: false, error: `Storage error: ${message}` });
}

/**
 * Recursively looks for a URL anywhere in the content document.
 * Used to refuse deleting an asset the site still renders.
 */
function findReferences(value: unknown, needle: string, path = ""): string[] {
  if (typeof value === "string") {
    return value.includes(needle) ? [path || "(root)"] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findReferences(item, needle, `${path}[${index}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) =>
      findReferences(item, needle, path ? `${path}.${key}` : key)
    );
  }
  return [];
}

export async function registerMediaRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Public read proxy for private buckets.
   *
   * Neon Object Storage buckets are private, and a presigned GET expires. Since
   * image URLs live inside published content, a stable first-party URL is the
   * only option — so media is streamed through here with an immutable cache
   * header. Registered before the auth hook below, deliberately: these bytes are
   * public marketing images, and the object key is an unguessable UUID.
   */
  app.get<{ Params: { "*": string } }>("/api/media/file/*", async (request, reply) => {
    const key = (request.params as { "*": string })["*"];

    if (storageProviderName() !== "s3") {
      return reply.code(404).send({ success: false, error: "Not found." });
    }

    // Authorisation by allowlist: only keys we recorded are ever served, so this
    // route cannot be used to walk the bucket.
    const record = await getMediaByObjectKey(key).catch(() => null);
    if (!record) {
      return reply.code(404).send({ success: false, error: "Not found." });
    }

    try {
      const provider = getStorageProvider();
      const object = await provider.getObjectStream(key);
      if (!object?.body) {
        return reply.code(404).send({ success: false, error: "Not found." });
      }

      reply.header("Content-Type", object.contentType ?? "application/octet-stream");
      if (object.contentLength !== null) reply.header("Content-Length", String(object.contentLength));
      // Object keys are unique and never rewritten, so this is safe to cache hard.
      reply.header("Cache-Control", "public, max-age=31536000, immutable");

      // The S3 SDK hands back a web ReadableStream, which Fastify accepts as-is.
      return reply.send(object.body);
    } catch (error) {
      request.log.error({ err: error, key }, "media proxy failed");
      return reply.code(502).send({ success: false, error: "Could not load that image." });
    }
  });

  /** Everything below requires a session. */
  app.register(async (admin) => {
    admin.addHook("preHandler", requireAuth);

    admin.get("/api/admin/media", async (_request, reply) => {
      try {
        const media = await listMedia();
        return reply.send({
          success: true,
          data: media,
          meta: { provider: storageProviderName() },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const notConfigured = (error as { code?: string })?.code === "DATABASE_NOT_CONFIGURED";
        return reply.code(notConfigured ? 503 : 502).send({ success: false, error: message });
      }
    });

    /**
     * Step 1 of a direct-to-storage upload. Returns a presigned PUT URL; the
     * bytes go straight to the bucket and never touch this process.
     */
    admin.post("/api/media/presign", async (request, reply) => {
      const body = (request.body ?? {}) as { filename?: unknown; contentType?: unknown };
      const filename = typeof body.filename === "string" ? body.filename : "";
      const contentType = typeof body.contentType === "string" ? body.contentType : "";

      if (!filename) {
        return reply.code(400).send({ success: false, error: "A filename is required." });
      }
      if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
        return reply.code(415).send({
          success: false,
          error: "Only JPEG, PNG, WebP and GIF images are accepted.",
        });
      }

      try {
        const provider = getStorageProvider();
        if (provider.name !== "s3") {
          // Cloudinary uploads are proxied; tell the client which flow to use.
          return reply.code(409).send({
            success: false,
            error: "The active storage provider does not use presigned uploads.",
            provider: provider.name,
          });
        }

        const presigned = await provider.createPresignedUpload({ filename, contentType });
        return reply.send({ success: true, data: presigned });
      } catch (error) {
        return replyStorageError(reply, error);
      }
    });

    /**
     * Step 2: the client reports the key it uploaded to. We verify the object is
     * really there and that its type and size are acceptable before recording it,
     * so a client cannot register an arbitrary key.
     */
    admin.post("/api/media/confirm", async (request, reply) => {
      const body = (request.body ?? {}) as { key?: unknown; alt?: unknown };
      const key = typeof body.key === "string" ? body.key : "";
      const alt = typeof body.alt === "string" ? body.alt.slice(0, 200) : "";

      const expectedPrefix = `${config.s3.folder.replace(/^\/+|\/+$/g, "")}/`;
      if (!key.startsWith(expectedPrefix) || key.includes("..")) {
        return reply.code(400).send({ success: false, error: "Invalid object key." });
      }

      try {
        const provider = getStorageProvider();
        const head = await provider.headObject(key);
        if (!head) {
          return reply
            .code(409)
            .send({ success: false, error: "That upload was not found in storage." });
        }

        if (head.bytes !== null && head.bytes > MAX_UPLOAD_BYTES) {
          // Do not keep an oversized object around.
          await provider.deleteObject(key).catch(() => undefined);
          return reply
            .code(413)
            .send({ success: false, error: "That file is too large. The limit is 5 MB." });
        }

        if (head.contentType && !ALLOWED_CONTENT_TYPES.has(head.contentType)) {
          await provider.deleteObject(key).catch(() => undefined);
          return reply.code(415).send({
            success: false,
            error: "Only JPEG, PNG, WebP and GIF images are accepted.",
          });
        }

        const object = await provider.confirmUpload(key);
        if (!object) {
          return reply.code(409).send({ success: false, error: "Upload could not be confirmed." });
        }

        const row = await insertMedia(
          {
            objectKey: object.key,
            url: object.url,
            secureUrl: object.secureUrl,
            alt,
            width: object.width,
            height: object.height,
            bytes: object.bytes,
            format: object.format,
            folder: config.s3.folder,
            storageProvider: provider.name,
          },
          actorEmail(request)
        );

        return reply.code(201).send({ success: true, data: row });
      } catch (error) {
        return replyStorageError(reply, error);
      }
    });

    /**
     * Server-proxied upload, kept for Cloudinary (which signs server-side).
     */
    admin.post("/api/media", async (request, reply) => {
      let data: Awaited<ReturnType<typeof request.file>>;
      try {
        data = await request.file({ limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } });
      } catch (error) {
        return replyStorageError(reply, error);
      }

      if (!data) {
        return reply.code(400).send({ success: false, error: "No file was uploaded." });
      }

      let buffer: Buffer;
      try {
        buffer = await data.toBuffer();
      } catch {
        return reply
          .code(413)
          .send({ success: false, error: "That file is too large. The limit is 5 MB." });
      }

      if (buffer.length === 0) {
        return reply.code(400).send({ success: false, error: "The uploaded file is empty." });
      }
      if (buffer.length > MAX_UPLOAD_BYTES) {
        return reply
          .code(413)
          .send({ success: false, error: "That file is too large. The limit is 5 MB." });
      }

      // Trust the bytes, not the client-supplied MIME type.
      const detected = sniffImageType(buffer);
      if (!detected) {
        return reply.code(415).send({
          success: false,
          error: "Only JPEG, PNG, WebP and GIF images are accepted.",
        });
      }

      const rawAlt = (data.fields?.alt as { value?: unknown } | undefined)?.value;
      const alt = typeof rawAlt === "string" ? rawAlt.slice(0, 200) : "";

      try {
        const provider = getStorageProvider();
        if (storageProviderName() === "s3") {
          return reply.code(409).send({
            success: false,
            error: "This deployment uses direct-to-storage uploads. Request a presigned URL instead.",
          });
        }

        const { uploadBuffer } = await import("../media/cloudinary.js");
        const asset = await uploadBuffer(buffer, { filename: data.filename });
        const row = await insertMedia(
          {
            objectKey: asset.publicId,
            url: asset.url,
            secureUrl: asset.secureUrl,
            alt,
            width: asset.width,
            height: asset.height,
            bytes: asset.bytes ?? buffer.length,
            format: asset.format ?? detected.format,
            folder: null,
            storageProvider: provider.name,
          },
          actorEmail(request)
        );

        return reply.code(201).send({ success: true, data: row });
      } catch (error) {
        return replyStorageError(reply, error);
      }
    });

    admin.delete("/api/admin/media/:id", async (request, reply) => {
      const id = (request.params as { id?: string }).id;
      if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
        return reply.code(400).send({ success: false, error: "Invalid media id." });
      }

      const force = (request.query as { force?: string }).force === "true";

      try {
        const rows = await listMedia(500);
        const target = rows.find((row) => row.id === id);
        if (!target) {
          return reply.code(404).send({ success: false, error: "Image not found." });
        }

        const published = await getContent(CONTENT_KEYS.published);
        const draft = await getContent(CONTENT_KEYS.draft);
        // Match on both forms: the proxy path and the object key itself.
        const references = [
          ...findReferences(published?.doc, target.secureUrl),
          ...findReferences(draft?.doc, target.secureUrl),
          ...findReferences(published?.doc, target.cloudinaryPublicId),
          ...findReferences(draft?.doc, target.cloudinaryPublicId),
        ];

        if (references.length > 0 && !force) {
          return reply.code(409).send({
            success: false,
            error: "This image is still used on the site.",
            references: [...new Set(references)],
          });
        }

        // Remove the database row first: if storage is unreachable we would
        // rather keep an orphaned object than a row pointing at nothing.
        const deleted = await deleteMedia(id);
        if (!deleted) {
          return reply.code(404).send({ success: false, error: "Image not found." });
        }

        let remoteDeleted = false;
        try {
          const provider = getStorageProvider();
          remoteDeleted = await provider.deleteObject(deleted.cloudinaryPublicId);
        } catch (error) {
          request.log.warn({ err: error }, "could not delete the stored object");
        }

        return reply.send({ success: true, data: { id, remoteDeleted } });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.code(502).send({ success: false, error: message });
      }
    });
  });
}
