import { useCallback, useEffect, useState } from "react";
import {
  editorSections,
  type SiteContent,
} from "../../shared/content/index.js";
import { adminApi, type AdminContentResponse } from "./api";
import { ApiError } from "../lib/api";
import { FieldRenderer } from "./FieldRenderer";
import { getByPath, setByPath, documentsMatch } from "./pathUtils";
import { applyContent } from "../content/store";

/**
 * The content editor.
 *
 * Two-phase by design: edits go to a DRAFT (so the public site is untouched),
 * and only Publish promotes them. Everything the dashboard can change is driven
 * by `editorSections`, so this file contains no per-field JSX.
 */
export function ContentEditor({ onSignOut }: { onSignOut: () => void }) {
  const [loaded, setLoaded] = useState<AdminContentResponse | null>(null);
  const [draft, setDraft] = useState<SiteContent | null>(null);
  const [activeTab, setActiveTab] = useState<string>(editorSections[0].id);

  const [busy, setBusy] = useState<"loading" | "saving" | "publishing" | "reverting" | null>("loading");
  const [message, setMessage] = useState<{ tone: "ok" | "error" | "warn"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [conflict, setConflict] = useState(false);

  const load = useCallback(async () => {
    setBusy("loading");
    setMessage(null);
    try {
      const response = await adminApi.getContent();
      setLoaded(response);
      setDraft(response.draft);
      setConflict(false);
      if (response.hasUnpublishedChanges) {
        setMessage({ tone: "warn", text: "There are unpublished changes in the draft." });
      }
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        onSignOut();
        return;
      }
      setMessage({
        tone: "error",
        text: caught instanceof ApiError ? caught.message : "Could not load content.",
      });
    } finally {
      setBusy(null);
    }
  }, [onSignOut]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = Boolean(loaded && draft && !documentsMatch(draft, loaded.draft));

  function updateField(path: string, next: unknown) {
    setDraft((current) => (current ? setByPath(current, path, next) : current));
    // Clear the error for the edited field so the form stops shouting at the
    // user as soon as they start fixing it.
    setFieldErrors((current) => {
      if (!current[path]) return current;
      const copy = { ...current };
      delete copy[path];
      return copy;
    });
  }

  async function handleSave() {
    if (!draft) return;
    setBusy("saving");
    setMessage(null);
    setFieldErrors({});
    try {
      const result = await adminApi.saveDraft(draft, loaded?.draftVersion ?? null);
      setLoaded((current) =>
        current ? { ...current, draft, draftVersion: result.draftVersion, hasUnpublishedChanges: true } : current
      );
      setMessage({ tone: "ok", text: `Draft saved at ${new Date(result.savedAt).toLocaleTimeString()}.` });
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        setConflict(true);
        setMessage({ tone: "error", text: caught.message });
      } else if (caught instanceof ApiError && caught.fields) {
        setFieldErrors(caught.fields);
        setMessage({ tone: "error", text: caught.message });
      } else {
        setMessage({
          tone: "error",
          text: caught instanceof ApiError ? caught.message : "Could not save the draft.",
        });
      }
    } finally {
      setBusy(null);
    }
  }

  async function handlePublish() {
    setBusy("publishing");
    setMessage(null);
    try {
      // Publish what is stored, so an unsaved edit is never silently published.
      if (dirty) {
        const saved = await adminApi.saveDraft(draft!, loaded?.draftVersion ?? null);
        setLoaded((current) =>
          current ? { ...current, draft: draft!, draftVersion: saved.draftVersion } : current
        );
      }
      const result = await adminApi.publish();
      setLoaded((current) =>
        current
          ? {
              ...current,
              published: current.draft,
              publishedVersion: result.version,
              hasUnpublishedChanges: false,
              publishedAt: new Date().toISOString(),
            }
          : current
      );
      // Refresh the in-memory public content so the admin's own preview and the
      // public site agree immediately.
      if (draft) applyContent(draft);
      setMessage({
        tone: "ok",
        text: result.snapshotWritten
          ? "Published. The live site and the static snapshot are updated."
          : "Published to the database, but the static snapshot file could not be written.",
      });
    } catch (caught) {
      if (caught instanceof ApiError && caught.fields) setFieldErrors(caught.fields);
      setMessage({
        tone: "error",
        text: caught instanceof ApiError ? caught.message : "Could not publish.",
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleRevert() {
    setBusy("reverting");
    setMessage(null);
    try {
      await adminApi.revert();
      await load();
      setMessage({ tone: "ok", text: "Draft discarded — it now matches the published site." });
    } catch (caught) {
      setMessage({
        tone: "error",
        text: caught instanceof ApiError ? caught.message : "Could not revert.",
      });
    } finally {
      setBusy(null);
    }
  }

  if (busy === "loading" && !draft) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="glass-card p-8 text-center space-y-4">
        <p className="text-primary/70">{message?.text ?? "Content could not be loaded."}</p>
        <button
          onClick={() => void load()}
          className="h-10 px-4 rounded-xl bg-primary text-white text-sm font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  const activeSection = editorSections.find((section) => section.id === activeTab) ?? editorSections[0];
  const sectionValue = getByPath(draft, activeSection.path);

  return (
    <div className="space-y-6">
      {/* status + actions */}
      <div className="glass-card p-4 md:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                dirty ? "bg-amber-500" : loaded?.hasUnpublishedChanges ? "bg-blue-500" : "bg-green-500"
              }`}
            />
            <span className="text-primary/60">
              {dirty
                ? "Unsaved edits"
                : loaded?.hasUnpublishedChanges
                  ? "Draft saved — not published"
                  : "Published and up to date"}
            </span>
            {loaded?.publishedAt && (
              <span className="text-primary/30 text-xs">
                last published {new Date(loaded.publishedAt).toLocaleString()}
                {loaded.publishedBy ? ` by ${loaded.publishedBy}` : ""}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={busy !== null}
              className="h-10 px-4 rounded-xl border border-surface-300 text-sm text-primary/70 hover:text-primary disabled:opacity-50"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={() => void handleRevert()}
              disabled={busy !== null || !loaded?.hasUnpublishedChanges}
              className="h-10 px-4 rounded-xl border border-surface-300 text-sm text-primary/70 hover:text-primary disabled:opacity-50"
            >
              Discard draft
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={busy !== null || !dirty}
              className="h-10 px-4 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50"
            >
              {busy === "saving" ? "Saving…" : "Save draft"}
            </button>
            <button
              type="button"
              onClick={() => void handlePublish()}
              disabled={busy !== null}
              className="h-10 px-4 rounded-xl bg-accent text-white text-sm font-medium disabled:opacity-50"
            >
              {busy === "publishing" ? "Publishing…" : "Publish"}
            </button>
          </div>
        </div>

        {message && (
          <p
            className={`text-sm ${
              message.tone === "ok"
                ? "text-green-700"
                : message.tone === "warn"
                  ? "text-amber-700"
                  : "text-red-600"
            }`}
          >
            {message.text}
          </p>
        )}

        {conflict && (
          <p className="text-sm text-red-600">
            Your draft is based on an older version.{" "}
            <button onClick={() => void load()} className="underline font-medium">
              Reload to get the latest
            </button>{" "}
            — copy anything you need first, reloading discards local edits.
          </p>
        )}

        {Object.keys(fieldErrors).length > 0 && (
          <div className="text-sm text-red-600">
            <p className="font-medium">Some fields need attention:</p>
            <ul className="list-disc pl-5">
              {Object.entries(fieldErrors).map(([path, error]) => (
                <li key={path}>
                  <span className="font-mono text-xs">{path}</span>: {error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* tabs */}
      <div className="flex flex-wrap gap-2">
        {editorSections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveTab(section.id)}
            className={`h-9 px-3.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === section.id
                ? "bg-accent/10 text-accent border border-accent/20"
                : "text-primary/60 border border-transparent hover:text-primary"
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* active panel */}
      <div className="glass-card p-5 md:p-6">
        <FieldRenderer
          path={activeSection.path}
          value={sectionValue}
          onChange={(next) => updateField(activeSection.path, next)}
        />
      </div>

      <p className="text-xs text-primary/40">
        Changes are saved to a draft that visitors cannot see. Press <strong>Publish</strong> to make them
        live.
      </p>
    </div>
  );
}
