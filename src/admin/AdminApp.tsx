import { useCallback, useEffect, useState } from "react";
import { History, Images, LogOut, Settings2 } from "lucide-react";
import { useAuth } from "./useAuth";
import { LoginScreen } from "./LoginScreen";
import { ContentEditor } from "./ContentEditor";
import { MediaLibrary } from "./MediaLibrary";
import { adminApi, type RevisionSummary } from "./api";
import { ApiError } from "../lib/api";

type Tab = "content" | "media" | "history";

/**
 * Dashboard shell.
 *
 * Signed-out users get the login screen and nothing else: every panel here talks
 * to `/api/admin/*`, which the API independently guards, so the client-side check
 * is only about UX and never the security boundary.
 */
export default function AdminApp() {
  const { status, session, error, signIn, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("content");

  if (status === "checking") {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-surface">
        <div className="w-8 h-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      </div>
    );
  }

  if (status === "signed-out" || !session) {
    return <LoginScreen onSubmit={signIn} error={error} />;
  }

  return (
    <div className="min-h-[100dvh] bg-surface">
      <header className="border-b border-surface-200 bg-white/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-display font-bold text-sm">
              N
            </div>
            <div>
              <p className="font-display font-semibold text-sm text-primary leading-tight">Content dashboard</p>
              <p className="text-xs text-primary/40 leading-tight">{session.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex h-9 items-center px-3 rounded-xl border border-surface-300 text-sm text-primary/60 hover:text-primary"
            >
              View site
            </a>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex h-9 items-center gap-1.5 px-3 rounded-xl border border-surface-300 text-sm text-primary/60 hover:text-primary"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 flex gap-1 pb-2">
          <TabButton active={tab === "content"} onClick={() => setTab("content")} icon={<Settings2 className="w-4 h-4" />}>
            Content
          </TabButton>
          <TabButton active={tab === "media"} onClick={() => setTab("media")} icon={<Images className="w-4 h-4" />}>
            Media
          </TabButton>
          <TabButton active={tab === "history"} onClick={() => setTab("history")} icon={<History className="w-4 h-4" />}>
            History
          </TabButton>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {tab === "content" && <ContentEditor onSignOut={() => void signOut()} />}
        {tab === "media" && <MediaLibrary />}
        {tab === "history" && <RevisionHistory />}
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-xl text-sm font-medium transition-colors ${
        active
          ? "bg-accent/10 text-accent border border-accent/20"
          : "text-primary/60 border border-transparent hover:text-primary"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

/**
 * Publish history. Restoring writes into the draft — it never changes the live
 * site directly, so a mistaken restore is always recoverable.
 */
function RevisionHistory() {
  const [revisions, setRevisions] = useState<RevisionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRevisions(await adminApi.revisions());
    } catch (caught) {
      setMessage({
        tone: "error",
        text: caught instanceof ApiError ? caught.message : "Could not load history.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function restore(id: string) {
    setMessage(null);
    try {
      await adminApi.restoreRevision(id);
      setMessage({
        tone: "ok",
        text: "Restored into the draft. Open the Content tab and press Publish to make it live.",
      });
    } catch (caught) {
      setMessage({
        tone: "error",
        text: caught instanceof ApiError ? caught.message : "Could not restore that revision.",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-primary/50">
        Each entry is a snapshot taken at publish time. Restoring copies it into the draft.
      </p>

      {message && (
        <p className={`text-sm ${message.tone === "ok" ? "text-green-700" : "text-red-600"}`}>
          {message.text}
        </p>
      )}

      {revisions.length === 0 ? (
        <div className="glass-card p-10 text-center text-primary/50">
          No published revisions yet. History builds up as you publish.
        </div>
      ) : (
        <div className="glass-card divide-y divide-surface-200">
          {revisions.map((revision) => (
            <div key={revision.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-primary font-medium">
                  Version {revision.version}
                  {revision.label ? ` — ${revision.label}` : ""}
                </p>
                <p className="text-xs text-primary/40">
                  {new Date(revision.createdAt).toLocaleString()}
                  {revision.author ? ` · ${revision.author}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void restore(revision.id)}
                className="h-9 px-3 rounded-xl border border-surface-300 text-sm text-primary/70 hover:text-primary"
              >
                Restore to draft
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
