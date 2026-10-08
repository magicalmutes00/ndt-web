import { destroyAsset, uploadBuffer } from "../media/cloudinary.js";
import type { StorageProvider, UploadedObject } from "./provider.js";

/**
 * Cloudinary adapter for the storage contract.
 *
 * Cloudinary is server-proxied rather than presigned: its upload endpoint needs
 * the API secret to sign, and the original implementation already streamed the
 * file through the API. It returns permanent public delivery URLs, so
 * `publicBaseUrl()` is non-null and content embeds `https://res.cloudinary.com/…`
 * directly rather than through our proxy.
 *
 * Kept so switching providers is a config change rather than a rewrite.
 */
export function createCloudinaryProvider(): StorageProvider {
  return {
    name: "cloudinary",

    /** Cloudinary URLs are permanent, so they can be embedded as-is. */
    publicBaseUrl: () => "https://res.cloudinary.com",

    async createPresignedUpload() {
      throw new Error(
        "Cloudinary uploads are server-proxied. POST the file to /api/media instead of using /api/media/presign."
      );
    },

    async headObject() {
      // No cheap metadata call without another Cloudinary request; the upload
      // response already carries dimensions, so we record those instead.
      return null;
    },

    async confirmUpload(key: string): Promise<UploadedObject | null> {
      // `key` is the Cloudinary public_id and is itself the delivery URL.
      return {
        key,
        url: key,
        secureUrl: key,
        width: null,
        height: null,
        bytes: null,
        format: key.includes(".") ? key.split(".").pop() ?? null : null,
      };
    },

    async deleteObject(key: string): Promise<boolean> {
      return destroyAsset(key);
    },

    async getObjectStream() {
      // Not needed: Cloudinary serves its own permanent URLs, so nothing has to
      // be proxied through the API.
      return null;
    },
  };
}

/** Re-exported so callers configuring Cloudinary do not reach into media/. */
export { uploadBuffer };
