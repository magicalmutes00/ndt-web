import { useCallback, useEffect, useState } from "react";
import { adminApi } from "./api";
import { ApiError } from "../lib/api";

export interface AdminSession {
  email: string;
  name: string | null;
  expiresAt: string;
}

/**
 * Session state for the dashboard.
 *
 * Authentication is delegated to Neon Auth: this hook only asks our API whether
 * the session cookie is still valid. `/api/auth/me` is the single source of
 * truth, so a stale tab cannot act on a session that was revoked upstream.
 */
export function useAuth() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [status, setStatus] = useState<"checking" | "signed-out" | "signed-in">("checking");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const me = await adminApi.me();
      setSession(me);
      setStatus("signed-in");
    } catch (caught) {
      setSession(null);
      setStatus("signed-out");
      if (caught instanceof ApiError && caught.status !== 401) {
        setError(caught.message);
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const me = await adminApi.login(email, password);
      setSession(me);
      setStatus("signed-in");
      return true;
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not sign in.");
      return false;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await adminApi.logout();
    } finally {
      setSession(null);
      setStatus("signed-out");
    }
  }, []);

  return { session, status, error, signIn, signOut, refresh, setError };
}
