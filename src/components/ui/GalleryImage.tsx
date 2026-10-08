import { useState } from "react";
import { ImageOff } from "lucide-react";

interface GalleryImageProps {
  src: string;
  alt: string;
  /** Shown on the placeholder when the file is missing. */
  category?: string;
  /** Skips lazy loading for the lightbox's single large image. */
  priority?: boolean;
}

/**
 * Image with a real fallback.
 *
 * The gallery data can reference files that were never added to /public/images,
 * and an admin can point at a URL that later 404s. Rather than rendering a
 * broken-image icon, a missing source degrades to a labelled placeholder — which
 * also makes the gap obvious during content review.
 */
export function GalleryImage({ src, alt, category, priority = false }: GalleryImageProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  if (!src) {
    return <Placeholder label={category ?? "No image"} />;
  }

  if (status === "error") {
    return <Placeholder label={category ?? "Image unavailable"} />;
  }

  return (
    <div className="relative w-full h-full">
      {status === "loading" && (
        <div className="absolute inset-0 bg-gradient-to-br from-surface-200 to-surface-100 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setStatus("ready")}
        onError={() => setStatus("error")}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          status === "ready" ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-surface-200 to-surface-100 flex flex-col items-center justify-center gap-2">
      <ImageOff className="w-6 h-6 text-primary/20" />
      <span className="text-primary/30 font-display text-sm">{label}</span>
    </div>
  );
}
