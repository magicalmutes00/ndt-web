import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadImage } from "./upload";
import { ApiError } from "../lib/api";

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string;
}

/**
 * Image picker backed by Cloudinary.
 *
 * The upload goes to our own API (which enforces the session and signs the
 * Cloudinary request), so no credentials or unsigned preset ever reach the
 * browser. A plain URL is still accepted for images hosted elsewhere.
 */
export function ImageField({ label, value, onChange, help }: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const { item } = await uploadImage(file, "");
      onChange(item.secureUrl);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-mono tracking-wider text-primary/50 uppercase">{label}</label>

      <div className="flex items-start gap-3">
        <div className="w-24 h-24 rounded-xl border border-surface-300 bg-surface-100 overflow-hidden shrink-0 flex items-center justify-center">
          {value ? (
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImagePlus className="w-6 h-6 text-primary/20" />
          )}
        </div>

        <div className="flex-1 space-y-2">
          <input
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="/images/example.jpg or https://…"
            className="w-full h-10 px-3 rounded-lg bg-white border border-surface-300 text-sm text-primary placeholder:text-primary/30 focus:border-accent/40"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
              {uploading ? "Uploading…" : "Upload"}
            </button>

            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-surface-300 text-xs text-primary/60 hover:text-primary"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          {help && <p className="text-xs text-primary/40">{help}</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}
