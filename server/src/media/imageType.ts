/**
 * Magic-byte sniffing for uploads.
 *
 * A client-declared MIME type is attacker-controlled, so the file's actual
 * signature decides whether we accept it. Only formats Cloudinary can serve as
 * images are allowed.
 */

export interface DetectedImage {
  format: "jpeg" | "png" | "webp" | "gif";
  mime: string;
}

function startsWith(buffer: Buffer, bytes: number[], offset = 0): boolean {
  if (buffer.length < offset + bytes.length) return false;
  return bytes.every((byte, index) => buffer[offset + index] === byte);
}

export function sniffImageType(buffer: Buffer): DetectedImage | null {
  // JPEG: FF D8 FF
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) {
    return { format: "jpeg", mime: "image/jpeg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { format: "png", mime: "image/png" };
  }

  // GIF: "GIF87a" / "GIF89a"
  if (startsWith(buffer, [0x47, 0x49, 0x46, 0x38])) {
    return { format: "gif", mime: "image/gif" };
  }

  // WebP: "RIFF" .... "WEBP"
  if (
    startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return { format: "webp", mime: "image/webp" };
  }

  return null;
}
