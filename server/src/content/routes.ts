import { z } from "zod";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { formatZodErrors, siteContentSchema } from "../../../shared/content/index.js";
import { requireAuth, actorEmail } from "../auth/middleware.js";
import {
  CONTENT_KEYS,
  getContent,
  listRevisions,
  publishContent,
  restoreRevisionAsDraft,
  revertDraft,
  saveDraft,
} from "../db/repo.js";
import {
  invalidatePublishedCache,
  loadPublished,
  writeSnapshotFile,
  type PublishedSnapshot,
} from "./store.js";

/** Header used for cache validation, plus the optimistic-concurrency guard. */
const ETAG_HEADER = "if-none-match";

function cacheHeaders(snapshot: PublishedSnapshot): Record<string, string> {
  return {
    ETag: snapshot.etag,
    "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  };
}

function matchesEtag(request: FastifyRequest, snapshot: PublishedSnapshot): boolean {
  const header = request.headers[ETAG_HEADER];
  if (typeof header !== "string") return false;
  return header
    .split(",")
    .map((value) => value.trim())
    .includes(snapshot.etag);
}

/* -------------------------------------------------------------------------- */
/*                               public content                               */
/* -------------------------------------------------------------------------- */

export async function registerContentRoutes(app: FastifyInstance): Promise<void> {
  /**
   * The public site's content. Never exposes drafts, and always answers — even
   * with the database down, because `loadPublished` degrades through cache →
   * snapshot file → compiled default.
   */
  app.get("/api/content", async (request, reply) => {
    const snapshot = await loadPublished();

    for (const [name, value] of Object.entries(cacheHeaders(snapshot))) {
      reply.header(name, value);
    }

    if (matchesEtag(request, snapshot)) {
      return reply.code(304).send();
    }

    return reply.send(snapshot.doc);
  });

  /** Diagnostics for the admin dashboard's connection banner. */
  app.get("/api/content/meta", async (_request, reply) => {
    const snapshot = await loadPublished();
    return reply.send({
      success: true,
      data: {
        version: snapshot.version,
        updatedAt: snapshot.updatedAt.toISOString(),
        source: snapshot.source,
        etag: snapshot.etag,
      },
    });
  });
}

/* -------------------------------------------------------------------------- */
/*                                admin content                               */
/* -------------------------------------------------------------------------- */

const saveDraftBodySchema = z.object({
  doc: siteContentSchema,
  /** Required once the client has loaded content; enables 409 conflict detection. */
  expectedVersion: z.number().int().min(1).nullable().optional(),
});

const publishBodySchema = z.object({
  label: z.string().trim().max(120).optional(),
});

function replyContentError(reply: FastifyReply, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const notConfigured = (error as { code?: string })?.code === "DATABASE_NOT_CONFIGURED";
  return reply.code(notConfigured ? 503 : 502).send({
    success: false,
    error: notConfigured
      ? "The database is not configured. Set DATABASE_URL and restart the API."
      : `Database error: ${message}`,
  });
}

/**
 * The body schema wraps the document as `{ doc, expectedVersion }`, so Zod
 * reports paths like `doc.settings.email`. Strip that prefix so the dashboard
 * can map each error straight onto the field it belongs to.
 */
function formatDocErrors(error: import("zod").ZodError): Record<string, string> {
  const formatted = formatZodErrors(error);
  const out: Record<string, string> = {};
  for (const [path, message] of Object.entries(formatted)) {
    out[path.startsWith("doc.") ? path.slice(4) : path] = message;
  }
  return out;
}

export async function registerAdminContentRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", requireAuth);

  /** Draft, published, and whether they differ — everything the editor needs. */
  app.get("/api/admin/content", async (_request, reply) => {
    try {
      const [draft, published] = await Promise.all([
        getContent(CONTENT_KEYS.draft),
        getContent(CONTENT_KEYS.published),
      ]);

      const fallback = await loadPublished();
      const draftDoc = draft?.doc ?? published?.doc ?? fallback.doc;
      const publishedDoc = published?.doc ?? fallback.doc;

      return reply.send({
        success: true,
        data: {
          draft: draftDoc,
          published: publishedDoc,
          draftVersion: draft?.version ?? 0,
          publishedVersion: published?.version ?? 0,
          publishedAt: published?.updatedAt.toISOString() ?? null,
          publishedBy: published?.updatedBy ?? null,
          hasUnpublishedChanges: JSON.stringify(draftDoc) !== JSON.stringify(publishedDoc),
        },
      });
    } catch (error) {
      return replyContentError(reply, error);
    }
  });

  app.put("/api/admin/content", async (request, reply) => {
    const parsed = saveDraftBodySchema.safeParse(request.body);
    if (!parsed.success) {
      // Surface the schema's own field paths so the form can highlight them.
      return reply.code(422).send({
        success: false,
        error: "Some fields are invalid.",
        fields: formatDocErrors(parsed.error),
      });
    }

    try {
      const version = await saveDraft(
        parsed.data.doc,
        parsed.data.expectedVersion ?? null,
        actorEmail(request)
      );

      if (version === null) {
        return reply.code(409).send({
          success: false,
          error:
            "Someone else saved changes while you were editing. Reload to see their version before saving.",
        });
      }

      return reply.send({
        success: true,
        data: { draftVersion: version, savedAt: new Date().toISOString() },
      });
    } catch (error) {
      return replyContentError(reply, error);
    }
  });

  /** Validates the draft, promotes it, then refreshes cache and snapshot file. */
  app.post("/api/admin/content/publish", async (request, reply) => {
    const parsed = publishBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ success: false, error: "Invalid publish request." });
    }

    try {
      const draft = await getContent(CONTENT_KEYS.draft);
      if (!draft) {
        return reply.code(409).send({ success: false, error: "There is no draft to publish." });
      }

      const validated = siteContentSchema.safeParse(draft.doc);
      if (!validated.success) {
        return reply.code(422).send({
          success: false,
          error: "The draft is not valid and was not published.",
          fields: formatZodErrors(validated.error),
        });
      }
      const result = await publishContent(actorEmail(request), parsed.data.label);
      invalidatePublishedCache();

      const snapshot = await loadPublished(true);
      const snapshotWritten = await writeSnapshotFile(snapshot.doc);

      return reply.send({
        success: true,
        data: {
          version: result.version,
          revisionId: result.revisionId,
          snapshotWritten,
          publishedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      return replyContentError(reply, error);
    }
  });

  app.post("/api/admin/content/revert", async (request, reply) => {
    try {
      const version = await revertDraft(actorEmail(request));
      if (version === null) {
        return reply.code(409).send({ success: false, error: "There is nothing to revert to." });
      }
      return reply.send({ success: true, data: { draftVersion: version } });
    } catch (error) {
      return replyContentError(reply, error);
    }
  });

  app.get("/api/admin/revisions", async (_request, reply) => {
    try {
      const revisions = await listRevisions();
      return reply.send({ success: true, data: revisions });
    } catch (error) {
      return replyContentError(reply, error);
    }
  });

  /** Restores into the draft; a deliberate publish is still required. */
  app.post("/api/admin/revisions/:id/restore", async (request, reply) => {
    const params = z.object({ id: z.string().regex(/^\d+$/) }).safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ success: false, error: "Invalid revision id." });
    }

    try {
      const version = await restoreRevisionAsDraft(params.data.id, actorEmail(request));
      if (version === null) {
        return reply.code(404).send({ success: false, error: "Revision not found." });
      }
      return reply.send({ success: true, data: { draftVersion: version } });
    } catch (error) {
      return replyContentError(reply, error);
    }
  });
}

/** Exported for the test suite. */
export const contentInternals = { cacheHeaders, matchesEtag };
