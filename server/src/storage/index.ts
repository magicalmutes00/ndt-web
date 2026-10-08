import { activeStorageProvider } from "../env.js";
import { StorageNotConfiguredError, type StorageProvider } from "./provider.js";
import { createS3Provider } from "./s3.js";
import { createCloudinaryProvider } from "./cloudinary.js";

export * from "./provider.js";

/**
 * Resolves the configured storage backend.
 *
 * Provider selection is by configuration, not by code: `STORAGE_PROVIDER` wins,
 * otherwise S3 when configured, otherwise Cloudinary. That means the same build
 * can run against either backend, and a migration is an env change.
 */

let cached: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (cached) return cached;

  switch (activeStorageProvider) {
    case "s3":
      cached = createS3Provider();
      break;
    case "cloudinary":
      cached = createCloudinaryProvider();
      break;
    default:
      throw new StorageNotConfiguredError();
  }

  return cached;
}

export function storageProviderName(): "s3" | "cloudinary" | null {
  return activeStorageProvider;
}

/** Test seam: drop the memoised provider. */
export function resetStorageProvider(): void {
  cached = null;
}
