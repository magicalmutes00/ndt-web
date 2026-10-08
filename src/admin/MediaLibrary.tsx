import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Database, Loader2, Upload } from "lucide-react";
import { adminApi, type ContentMeta, type MediaItem } from "./api";
import { uploadImage } from "./upload";
import { ApiError } from "../lib/api";

/**
 * Media library: upload to Cloudinary, list, copy a URL, delete.
 *
 * Deletion is refused by the API while an asset is still referenced in the
 * content document; the "force" path is offered only after that refusal, so the
 * destructive choice is always informed.
 */
export function MediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [meta, setMeta] = useState<ContentMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error" | "warn"; text: string; refs?: string[] } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const [media, contentMeta] = await Promise.all([adminApi.media(), adminApi.contentMeta()]);
      setItems(media);
      setMeta(contentMeta);
    } catch (caught) {
      setMessage({
        tone: "error",
        text: caught instanceof ApiError ? caught.message : "Could not load the media library.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setMessage(null);
    try {
      const methods = new Set<string>();
      for (const file of Array.from(files)) {
        const { method } = await uploadImage(file, "");
        methods.add(method);
      }
      setMessage({
        tone: "ok",
        text:
          `Uploaded ${files.length} image(s)` +
          (methods.has("direct") ? " directly to object storage." : " via the API."),
      });
      await refresh();
    } catch (caught) {
      setMessage({
        tone: "error",
        text: caught instanceof ApiError ? caught.message : "Upload failed.",
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(item: MediaItem, force: boolean) {
    setMessage(null);
    try {
      await adminApi.deleteMedia(item.id, force);
      setMessage({ tone: "ok", text: "Image deleted." });
      await refresh();
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        setMessage({
          tone: "warn",
          text: `${caught.message} Referenced in: ${(caught.references ?? []).join(", ")}. Delete anyway?`,
          refs: caught.references,
        });
      } else {
        setMessage({
          tone: "error",
          text: caught instanceof ApiError ? caught.message : "Could not delete the image.",
        });
      }
    }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setMessage({ tone: "error", text: "Clipboard access was blocked by the browser." });
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-4 md:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-primary/60">
            <Database className="w-4 h-4 text-accent" />
            {meta ? (
              <span>
                Content source: <strong className="text-primary">{meta.source}</strong> · version {meta.version}
              </span>
            ) : (
              <span>Checking content source…</span>
            )}
          </div>

          <label className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-white text-sm font-medium cursor-pointer">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "Uploading…" : "Upload images"}
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(event) => void handleUpload(event.target.files)}
            />
          </label>
        </div>

        {meta?.source === "compiled-default" && (
          <p className="text-sm text-amber-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            The API is serving compiled fallback content, which means the database is unreachable. Uploads and
            publishing will fail until it is back.
          </p>
        )}

        {message && (
          <div className="space-y-2">
            <p
              className={`text-sm flex items-start gap-2 ${
                message.tone === "ok"
                  ? "text-green-700"
                  : message.tone === "warn"
                    ? "text-amber-700"
                    : "text-red-600"
              }`}
            >
              {message.tone === "ok" ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              )}
              {message.text}
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card p-10 text-center text-primary/50">
          No images yet. Upload one, then copy its URL into any image field.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="glass-card overflow-hidden">
              <div className="aspect-[4/3] bg-surface-100">
                <img src={item.secureUrl} alt={item.alt} loading="lazy" className="w-full h-full object-cover" />
              </div>
              <div className="p-3 space-y-2">
                <p className="text-xs text-primary/50 truncate" title={item.cloudinaryPublicId}>
                  {item.format?.toUpperCase()} · {item.width}×{item.height}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void copyUrl(item.secureUrl)}
                    className="flex-1 h-8 rounded-lg border border-surface-300 text-xs text-primary/70 hover:text-primary"
                  >
                    {copied === item.secureUrl ? "Copied!" : "Copy URL"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(item, false)}
                    className="h-8 px-2.5 rounded-lg border border-red-200 text-xs text-red-500 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
