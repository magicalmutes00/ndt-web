import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { Readable } from "node:stream";
import { config, isCloudinaryConfigured } from "../env.js";

/**
 * Cloudinary uploads.
 *
 * Uploads are signed server-side with the API secret — never an unsigned
 * browser preset — so the credentials never reach the client and every write is
 * authorised by our own session check first.
 */

export class CloudinaryNotConfiguredError extends Error {
  readonly code = "CLOUDINARY_NOT_CONFIGURED";
  constructor() {
    super(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."
    );
    this.name = "CloudinaryNotConfiguredError";
  }
}

let configured = false;

function client() {
  if (!isCloudinaryConfigured) throw new CloudinaryNotConfiguredError();
  if (!configured) {
    cloudinary.config({
      cloud_name: config.cloudinary.cloudName,
      api_key: config.cloudinary.apiKey,
      api_secret: config.cloudinary.apiSecret,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

export interface UploadedAsset {
  publicId: string;
  url: string;
  secureUrl: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  format: string | null;
  resourceType: string;
}

/**
 * Streams a buffer to Cloudinary without buffering the whole asset twice.
 * `upload_stream` is callback-based and does not always emit an error event, so
 * the promise is settled by the callback and settled-at-most-once is enforced.
 */
export async function uploadBuffer(
  buffer: Buffer,
  options: { folder?: string; filename?: string } = {}
): Promise<UploadedAsset> {
  const api = client();
  const folder = options.folder ?? config.cloudinary.folder;

  return new Promise<UploadedAsset>((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    const stream = api.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        // Keeps the original filename readable in the Cloudinary media library.
        use_filename: Boolean(options.filename),
        unique_filename: true,
        overwrite: false,
        filename_override: options.filename,
      },
      (error, result?: UploadApiResponse) => {
        if (error || !result) {
          finish(() => reject(error ?? new Error("Cloudinary returned no result")));
          return;
        }
        finish(() =>
          resolve({
            publicId: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
            width: result.width ?? null,
            height: result.height ?? null,
            bytes: result.bytes ?? null,
            format: result.format ?? null,
            resourceType: result.resource_type ?? "image",
          })
        );
      }
    );

    stream.on("error", (error) => finish(() => reject(error)));
    Readable.from(buffer).pipe(stream);
  });
}

/** Best-effort remote delete; a missing asset is not an error for our purposes. */
export async function destroyAsset(publicId: string): Promise<boolean> {
  try {
    const api = client();
    const result = await api.uploader.destroy(publicId, { resource_type: "image" });
    return result.result === "ok" || result.result === "not found";
  } catch (error) {
    console.error(
      "[cloudinary] destroy failed:",
      error instanceof Error ? error.message : error
    );
    return false;
  }
}
