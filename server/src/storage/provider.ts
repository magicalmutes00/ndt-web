/**
 * Storage provider contract.
 *
 * Two shapes are supported, and the difference matters:
 *
 *  - **Cloudinary** returns a permanent public delivery URL, so an uploaded
 *    image can be embedded in the content document and still resolve a year
 *    later.
 *  - **S3 (Neon Object Storage)** with a private bucket cannot: a presigned URL
 *    expires. Embedding one would leave every image broken once it lapsed, so
 *    uploads store only the object key and reads go through our own
 *    `/api/media/file/<key>` proxy, which is a stable first-party URL.
 *
 * `publicBaseUrl` therefore returns null for a private S3 bucket, and callers
 * fall back to the proxy path.
 */

export interface PresignedUpload {
  uploadUrl: string;
  key: string;
  /** Headers the client must send, verbatim, for the signature to match. */
  headers: Record<string, string>;
  expiresInSeconds: number;
}

export interface UploadedObject {
  key: string;
  url: string;
  secureUrl: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  format: string | null;
}

export interface ObjectHead {
  contentType: string | null;
  bytes: number | null;
}

export interface StorageProvider {
  readonly name: "s3" | "cloudinary";

  /**
   * URL an upload should be embedded with. `null` means "serve it through our
   * proxy instead", which is the case for a private bucket.
   */
  publicBaseUrl(): string | null;

  /** Step 1 of an upload: a signed URL the browser PUTs to directly. */
  createPresignedUpload(input: {
    filename: string;
    contentType: string;
  }): Promise<PresignedUpload>;

  /** Step 2: confirm the object exists and describe it. */
  confirmUpload(key: string): Promise<UploadedObject | null>;

  /** Remove the stored object. Missing objects are not an error. */
  deleteObject(key: string): Promise<boolean>;

  /** Streaming read, used by the proxy route. */
  getObjectStream(key: string): Promise<{
    body: ReadableStream<Uint8Array> | null;
    contentType: string | null;
    contentLength: number | null;
  } | null>;

  /** Metadata only, used to validate a confirmed upload. */
  headObject(key: string): Promise<ObjectHead | null>;
}

export class StorageNotConfiguredError extends Error {
  readonly code = "STORAGE_NOT_CONFIGURED";
  constructor() {
    super(
      "No storage provider is configured. Set the S3 variables (AWS_ENDPOINT_URL_S3, AWS_REGION, " +
        "AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET) or the CLOUDINARY_* variables."
    );
    this.name = "StorageNotConfiguredError";
  }
}

export function extensionForContentType(contentType: string): string {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
}

/**
 * Strips any path components so a client filename cannot escape our folder, then
 * reduces what is left to a safe slug. Runs of unsafe characters collapse to a
 * single dash and leading/trailing dashes are removed, so the result is always a
 * tidy key segment.
 */
export function safeBaseName(filename: string): string {
  const base = filename.split(/[\\/]/).pop() ?? "upload";
  const cleaned = base
    .replace(/\.[^.]*$/, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 60)
    .replace(/[-.]+$/g, "");
  return cleaned || "upload";
}
