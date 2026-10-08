import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config, isS3Configured } from "../env.js";
import {
  extensionForContentType,
  safeBaseName,
  StorageNotConfiguredError,
  type ObjectHead,
  type PresignedUpload,
  type StorageProvider,
  type UploadedObject,
} from "./provider.js";

/**
 * S3-compatible storage — built for and tested against Neon Object Storage.
 *
 * Uploads go **directly from the browser to the bucket** using a presigned PUT,
 * so image bytes never pass through the API:
 *
 *   1. POST /api/media/presign  -> { uploadUrl, key, headers }
 *   2. browser PUTs the file to uploadUrl
 *   3. POST /api/media          -> server HeadObjects the key, then records it
 *
 * The key is always generated server-side, so a client cannot choose an
 * arbitrary path.
 */

let client: S3Client | null = null;

function s3(): S3Client {
  if (!isS3Configured) throw new StorageNotConfiguredError();
  if (!client) {
    client = new S3Client({
      endpoint: config.s3.endpoint,
      region: config.s3.region,
      credentials: {
        accessKeyId: config.s3.accessKeyId!,
        secretAccessKey: config.s3.secretAccessKey!,
      },
      // Required by Neon Object Storage and most non-AWS endpoints.
      forcePathStyle: true,
      /**
       * AWS SDK v3 (>= 3.729) computes a CRC32 by default and appends
       * `x-amz-checksum-crc32` to presigned URLs. A browser PUT cannot supply
       * the matching header, and S3 validates the query parameter, so uploads
       * fail. Restricting checksums to "when required" keeps presigned PUTs
       * usable from the browser.
       */
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
  return client;
}

function bucket(): string {
  if (!config.s3.bucket) throw new StorageNotConfiguredError();
  return config.s3.bucket;
}

/** Server-generated, collision-proof, and confined to the configured folder. */
function buildKey(filename: string, contentType: string): string {
  const extension = extensionForContentType(contentType);
  const base = safeBaseName(filename);
  const folder = config.s3.folder.replace(/^\/+|\/+$/g, "");
  return `${folder}/${base}-${randomUUID()}.${extension}`;
}

export function createS3Provider(): StorageProvider {
  return {
    name: "s3",

    /**
     * Always null: the bucket is private, and a presigned GET would expire.
     * Media is served through /api/media/file/<key> instead.
     */
    publicBaseUrl: () => null,

    async createPresignedUpload({ filename, contentType }): Promise<PresignedUpload> {
      const key = buildKey(filename, contentType);
      const command = new PutObjectCommand({
        Bucket: bucket(),
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(s3(), command, {
        expiresIn: config.s3.uploadUrlTtlSeconds,
      });

      return {
        uploadUrl,
        key,
        // ContentType is part of the signature, so the browser must send it.
        headers: { "Content-Type": contentType },
        expiresInSeconds: config.s3.uploadUrlTtlSeconds,
      };
    },

    async headObject(key: string): Promise<ObjectHead | null> {
      try {
        const head = await s3().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
        return {
          contentType: head.ContentType ?? null,
          bytes: head.ContentLength ?? null,
        };
      } catch (error) {
        // A missing object is an expected outcome, not a failure.
        const name = (error as { name?: string }).name;
        if (name === "NotFound" || name === "NoSuchKey") return null;
        const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
        if (status === 404) return null;
        throw error;
      }
    },

    async confirmUpload(key: string): Promise<UploadedObject | null> {
      const head = await this.headObject(key);
      if (!head) return null;

      const format = key.includes(".") ? key.split(".").pop() ?? null : null;
      // The proxy path is the durable URL; it never expires.
      const proxyUrl = `/api/media/file/${key}`;

      return {
        key,
        url: proxyUrl,
        secureUrl: proxyUrl,
        width: null,
        height: null,
        bytes: head.bytes,
        format,
      };
    },

    async deleteObject(key: string): Promise<boolean> {
      try {
        await s3().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
        return true;
      } catch (error) {
        console.error(
          "[s3] delete failed:",
          error instanceof Error ? error.message : error
        );
        return false;
      }
    },

    async getObjectStream(key: string) {
      try {
        const result = await s3().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
        /**
         * `Body` is a Smithy `SdkStream` — a web `ReadableStream` at runtime in
         * Node 18+. Handing it to Fastify works directly; wrapping it in
         * `Readable.fromWeb` does not, because the SDK's type is a `Message`
         * wrapper rather than a Node stream.
         */
        return {
          body: (result.Body as unknown as ReadableStream<Uint8Array>) ?? null,
          contentType: result.ContentType ?? null,
          contentLength: result.ContentLength ?? null,
        };
      } catch (error) {
        const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
        if (status === 404) return null;
        throw error;
      }
    },
  };
}
