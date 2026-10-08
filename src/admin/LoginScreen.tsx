import { useState, type FormEvent } from "react";
import { Loader2, LockKeyhole } from "lucide-react";

interface LoginScreenProps {
  onSubmit: (email: string, password: string) => Promise<boolean>;
  error: string | null;
}

export function LoginScreen({ onSubmit, error }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(email, password);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-surface px-4">
      <form onSubmit={handleSubmit} className="glass-card w-full max-w-sm p-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <LockKeyhole className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-semibold text-primary">Admin sign in</h1>
            <p className="text-xs text-primary/40">Content dashboard</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="admin-email" className="text-xs font-mono tracking-wider text-primary/50 uppercase">
            Email
          </label>
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-white border border-surface-300 text-sm text-primary focus:border-accent/40"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="admin-password" className="text-xs font-mono tracking-wider text-primary/50 uppercase">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-white border border-surface-300 text-sm text-primary focus:border-accent/40"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-11 rounded-xl bg-accent text-white text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
