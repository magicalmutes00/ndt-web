import { adminApi, type MediaItem } from "./api";
import { ApiError } from "../lib/api";

/**
 * Client-side upload flow.
 *
 * The API decides the path: with S3 the browser uploads **directly to the
 * bucket** using a presigned PUT, so image bytes never pass through our server.
 * With Cloudinary the file is posted to our API, which signs and forwards it
 * server-side. Both end with a `MediaItem` row, so callers do not care which ran.
 */

export interface UploadResult {
  item: MediaItem;
  /** Which path was taken — surfaced in the UI so behaviour is not a mystery. */
  method: "direct" | "proxied";
}

export async function uploadImage(file: File, alt = ""): Promise<UploadResult> {
  // Ask for a presigned URL. A 409 means the active provider is not S3.
  let presigned;
  try {
    presigned = await adminApi.presignUpload(file.name, file.type || "application/octet-stream");
  } catch (error) {
    if (error instanceof ApiError && (error.status === 409 || error.status === 503)) {
      const item = await adminApi.uploadMedia(file, alt);
      return { item, method: "proxied" };
    }
    throw error;
  }

  // Direct PUT. The signature covers Content-Type, so it must match exactly.
  const response = await fetch(presigned.uploadUrl, {
    method: "PUT",
    body: file,
    headers: presigned.headers,
  });

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `Storage rejected the upload (HTTP ${response.status}). The link may have expired — try again.`
    );
  }

  const item = await adminApi.confirmUpload(presigned.key, alt);
  return { item, method: "direct" };
}
