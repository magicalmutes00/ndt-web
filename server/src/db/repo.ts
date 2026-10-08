import { randomUUID } from "node:crypto";
import type { SiteContent } from "../../../shared/content/schema.js";
import { ensureSchema, requirePool, withTransaction } from "./index.js";

/**
 * Data access for everything *we* own.
 *
 * Identity is deliberately absent: users, credentials and sessions are managed by
 * Neon Auth in its own `neon_auth` schema, so there is no password hash or
 * session token anywhere in this file.
 *
 * Every statement is parameterised — no value is ever interpolated into SQL.
 */

export const CONTENT_KEYS = { published: "published", draft: "draft" } as const;
export type ContentKey = (typeof CONTENT_KEYS)[keyof typeof CONTENT_KEYS];

export const MAX_REVISIONS = 50;

export interface ContentRow {
  doc: SiteContent;
  version: number;
  updatedAt: Date;
  updatedBy: string | null;
}

export interface RevisionRow {
  id: string;
  version: number;
  label: string | null;
  author: string | null;
  createdAt: Date;
}

export interface MediaRow {
  id: string;
  cloudinaryPublicId: string;
  url: string;
  secureUrl: string;
  alt: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  format: string | null;
  folder: string | null;
  createdAt: Date;
  /** Which backend holds the object. */
  storageProvider: string;
}

interface MediaDbRow {
  id: string;
  cloudinary_public_id: string;
  url: string;
  secure_url: string;
  alt: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  format: string | null;
  folder: string | null;
  created_at: Date;
  storage_provider: string;
}

const MEDIA_COLUMNS =
  "id, cloudinary_public_id, url, secure_url, alt, width, height, bytes, format, folder, created_at, storage_provider";

function mapMediaRow(row: MediaDbRow): MediaRow {
  return {
    id: row.id,
    cloudinaryPublicId: row.cloudinary_public_id,
    url: row.url,
    secureUrl: row.secure_url,
    alt: row.alt,
    width: row.width,
    height: row.height,
    bytes: row.bytes,
    format: row.format,
    folder: row.folder,
    createdAt: row.created_at,
    storageProvider: row.storage_provider,
  };
}

/* -------------------------------------------------------------------------- */
/*                                  content                                   */
/* -------------------------------------------------------------------------- */

export async function getContent(key: ContentKey): Promise<ContentRow | null> {
  await ensureSchema();
  const { rows } = await requirePool().query<{
    doc: SiteContent;
    version: number;
    updated_at: Date;
    updated_by: string | null;
  }>("select doc, version, updated_at, updated_by from content where key = $1", [key]);

  const row = rows[0];
  if (!row) return null;
  return {
    doc: row.doc,
    version: row.version,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

/**
 * Seeds both rows if the table is empty. Called once at boot so a brand-new
 * database immediately has a published document to serve.
 */
export async function seedContentIfEmpty(doc: SiteContent): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await requirePool().query(
    `insert into content (key, doc, version, updated_by)
     values ($1, $2::jsonb, 1, 'seed'), ($3, $4::jsonb, 1, 'seed')
     on conflict (key) do nothing`,
    [CONTENT_KEYS.published, JSON.stringify(doc), CONTENT_KEYS.draft, JSON.stringify(doc)]
  );
  return (rowCount ?? 0) > 0;
}

/**
 * Optimistic-concurrency write. Returns the new version, or `null` when the
 * caller's `expectedVersion` no longer matches (someone else saved first).
 */
export async function saveDraft(
  doc: SiteContent,
  expectedVersion: number | null,
  updatedBy: string
): Promise<number | null> {
  await ensureSchema();
  const pool = requirePool();

  if (expectedVersion === null) {
    const { rows } = await pool.query<{ version: number }>(
      `insert into content (key, doc, version, updated_at, updated_by)
       values ($1, $2::jsonb, 1, now(), $3)
       on conflict (key) do update
         set doc = excluded.doc,
             version = content.version + 1,
             updated_at = now(),
             updated_by = excluded.updated_by
       returning version`,
      [CONTENT_KEYS.draft, JSON.stringify(doc), updatedBy]
    );
    return rows[0]?.version ?? null;
  }

  const { rows } = await pool.query<{ version: number }>(
    `update content
        set doc = $2::jsonb, version = version + 1, updated_at = now(), updated_by = $3
      where key = $1 and version = $4
      returning version`,
    [CONTENT_KEYS.draft, JSON.stringify(doc), updatedBy, expectedVersion]
  );
  return rows[0]?.version ?? null;
}

export interface PublishResult {
  revisionId: string | null;
  version: number;
}

/**
 * Promotes the draft to published inside one transaction: snapshot the outgoing
 * published document into `revisions`, promote the draft, then prune history.
 */
export async function publishContent(updatedBy: string, label?: string): Promise<PublishResult> {
  await ensureSchema();

  return withTransaction(async (client) => {
    const current = await client.query<{ doc: SiteContent; version: number }>(
      "select doc, version from content where key = 'published' for update"
    );
    const draft = await client.query<{ doc: SiteContent; version: number }>(
      "select doc, version from content where key = 'draft' for update"
    );

    const draftRow = draft.rows[0];
    if (!draftRow) throw new Error("Cannot publish: no draft content exists.");

    let revisionId: string | null = null;
    const currentRow = current.rows[0];
    if (currentRow) {
      const inserted = await client.query<{ id: string }>(
        `insert into revisions (doc, version, label, author)
         values ($1::jsonb, $2, $3, $4)
         returning id`,
        [JSON.stringify(currentRow.doc), currentRow.version, label ?? null, updatedBy]
      );
      revisionId = inserted.rows[0]?.id ?? null;
    }

    const promoted = await client.query<{ version: number }>(
      `insert into content (key, doc, version, updated_at, updated_by)
       values ('published', $1::jsonb, 1, now(), $2)
       on conflict (key) do update
         set doc = excluded.doc,
             version = content.version + 1,
             updated_at = now(),
             updated_by = excluded.updated_by
       returning version`,
      [JSON.stringify(draftRow.doc), updatedBy]
    );

    // Keep the draft byte-identical to what was published so the "unpublished
    // changes" indicator resets cleanly.
    await client.query(
      `update content set doc = $1::jsonb, updated_at = now(), updated_by = $2 where key = 'draft'`,
      [JSON.stringify(draftRow.doc), updatedBy]
    );

    await client.query(
      `delete from revisions
        where id not in (select id from revisions order by created_at desc, id desc limit $1)`,
      [MAX_REVISIONS]
    );

    return { revisionId, version: promoted.rows[0]?.version ?? draftRow.version };
  });
}

/** Discards local edits by copying published back over the draft. */
export async function revertDraft(updatedBy: string): Promise<number | null> {
  await ensureSchema();
  const { rows } = await requirePool().query<{ version: number }>(
    `update content
        set doc = (select doc from content where key = 'published'),
            version = version + 1,
            updated_at = now(),
            updated_by = $1
      where key = 'draft'
        and exists (select 1 from content where key = 'published')
      returning version`,
    [updatedBy]
  );
  return rows[0]?.version ?? null;
}

export async function listRevisions(limit = MAX_REVISIONS): Promise<RevisionRow[]> {
  await ensureSchema();
  const { rows } = await requirePool().query<{
    id: string;
    version: number;
    label: string | null;
    author: string | null;
    created_at: Date;
  }>(
    `select id, version, label, author, created_at
       from revisions
      order by created_at desc, id desc
      limit $1`,
    [Math.min(Math.max(limit, 1), MAX_REVISIONS)]
  );
  return rows.map((row) => ({
    id: row.id,
    version: row.version,
    label: row.label,
    author: row.author,
    createdAt: row.created_at,
  }));
}

export async function getRevisionDoc(id: string): Promise<SiteContent | null> {
  await ensureSchema();
  const { rows } = await requirePool().query<{ doc: SiteContent }>(
    "select doc from revisions where id = $1",
    [id]
  );
  return rows[0]?.doc ?? null;
}

/**
 * Restores a revision into the *draft* only. Restoring must never change what
 * the public sees, so the admin has to publish deliberately afterwards.
 */
export async function restoreRevisionAsDraft(
  id: string,
  updatedBy: string
): Promise<number | null> {
  const doc = await getRevisionDoc(id);
  if (!doc) return null;
  return saveDraft(doc, null, `${updatedBy} (restored revision ${id})`);
}

/* -------------------------------------------------------------------------- */
/*                                    media                                   */
/* -------------------------------------------------------------------------- */

export interface NewMedia {
  /** Provider object identifier: the S3 object key, or the Cloudinary public id. */
  objectKey: string;
  url: string;
  secureUrl: string;
  alt: string;
  width?: number | null;
  height?: number | null;
  bytes?: number | null;
  format?: string | null;
  folder?: string | null;
  storageProvider: string;
}

export async function insertMedia(media: NewMedia, createdBy: string): Promise<MediaRow> {
  await ensureSchema();
  const id = randomUUID();
  const { rows } = await requirePool().query<MediaDbRow>(
    `insert into media
       (id, cloudinary_public_id, url, secure_url, alt, width, height, bytes, format, folder, created_by, storage_provider)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     returning ${MEDIA_COLUMNS}`,
    [
      id,
      media.objectKey,
      media.url,
      media.secureUrl,
      media.alt,
      media.width ?? null,
      media.height ?? null,
      media.bytes ?? null,
      media.format ?? null,
      media.folder ?? null,
      createdBy,
      media.storageProvider,
    ]
  );

  return mapMediaRow(rows[0]);
}

/**
 * Lookup by object key. The media proxy uses this as its authorisation check:
 * only keys we have recorded are ever served, so the proxy cannot be used to
 * enumerate the bucket.
 */
export async function getMediaByObjectKey(objectKey: string): Promise<MediaRow | null> {
  await ensureSchema();
  const { rows } = await requirePool().query<MediaDbRow>(
    `select ${MEDIA_COLUMNS} from media where cloudinary_public_id = $1 limit 1`,
    [objectKey]
  );
  const row = rows[0];
  return row ? mapMediaRow(row) : null;
}

export async function listMedia(limit = 200): Promise<MediaRow[]> {
  await ensureSchema();
  const { rows } = await requirePool().query<MediaDbRow>(
    `select ${MEDIA_COLUMNS}
       from media
      order by created_at desc
      limit $1`,
    [Math.min(Math.max(limit, 1), 500)]
  );
  return rows.map(mapMediaRow);
}

export async function deleteMedia(id: string): Promise<MediaRow | null> {
  await ensureSchema();
  const { rows } = await requirePool().query<MediaDbRow>(
    `delete from media where id = $1
     returning ${MEDIA_COLUMNS}`,
    [id]
  );

  const row = rows[0];
  return row ? mapMediaRow(row) : null;
}
