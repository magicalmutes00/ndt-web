import type { SiteContent } from "../../shared/content/schema.js";
import { api } from "../lib/api.js";

export interface AdminContentResponse {
  draft: SiteContent;
  published: SiteContent;
  draftVersion: number;
  publishedVersion: number;
  publishedAt: string | null;
  publishedBy: string | null;
  hasUnpublishedChanges: boolean;
}

export interface RevisionSummary {
  id: string;
  version: number;
  label: string | null;
  author: string | null;
  createdAt: string;
}

export interface MediaItem {
  id: string;
  cloudinaryPublicId: string;
  url: string;
  secureUrl: string;
  alt: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  format: string | null;
  createdAt: string;
  storageProvider: string;
}

export interface PresignedUpload {
  uploadUrl: string;
  key: string;
  headers: Record<string, string>;
  expiresInSeconds: number;
}

export interface ContentMeta {
  version: number;
  updatedAt: string;
  source: "database" | "snapshot-file" | "compiled-default";
  etag: string;
}

export const adminApi = {
  login: (email: string, password: string) =>
    api.post<{ email: string; name: string | null; expiresAt: string }>("/api/auth/login", {
      email,
      password,
    }),

  logout: () => api.post<{ signedOut: boolean }>("/api/auth/logout"),

  me: () => api.get<{ email: string; name: string | null; expiresAt: string }>("/api/auth/me"),

  getContent: () => api.get<AdminContentResponse>("/api/admin/content"),

  saveDraft: (doc: SiteContent, expectedVersion: number | null) =>
    api.put<{ draftVersion: number; savedAt: string }>("/api/admin/content", {
      doc,
      expectedVersion,
    }),

  publish: (label?: string) =>
    api.post<{ version: number; revisionId: string | null; snapshotWritten: boolean }>(
      "/api/admin/content/publish",
      { label }
    ),

  revert: () => api.post<{ draftVersion: number }>("/api/admin/content/revert"),

  revisions: () => api.get<RevisionSummary[]>("/api/admin/revisions"),

  restoreRevision: (id: string) =>
    api.post<{ draftVersion: number }>(`/api/admin/revisions/${id}/restore`),

  media: () => api.get<MediaItem[]>("/api/admin/media"),

  /** Step 1 of a direct-to-storage upload. 409 when the provider is not S3. */
  presignUpload: (filename: string, contentType: string) =>
    api.post<PresignedUpload>("/api/media/presign", { filename, contentType }),

  /** Step 2: register an object the browser uploaded directly. */
  confirmUpload: (key: string, alt: string) =>
    api.post<MediaItem>("/api/media/confirm", { key, alt }),

  /** Server-proxied upload (Cloudinary). */
  uploadMedia: (file: File, alt: string) => {
    const form = new FormData();
    form.append("file", file);
    if (alt) form.append("alt", alt);
    return api.post<MediaItem>("/api/media", form);
  },

  deleteMedia: (id: string, force = false) =>
    api.delete<{ id: string; remoteDeleted: boolean }>(
      `/api/admin/media/${id}${force ? "?force=true" : ""}`
    ),

  /** Diagnostics shown in the dashboard's connection banner. */
  contentMeta: () => api.get<ContentMeta>("/api/content/meta"),
};
