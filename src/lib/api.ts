/**
 * API client.
 *
 * Same-origin by default (`/api`), which keeps session cookies first-party. Set
 * VITE_API_BASE_URL only when the SPA is served from a different origin than the
 * API, in which case the API must also allow that origin via CORS_ORIGINS.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  readonly status: number;
  readonly fields?: Record<string, string>;
  readonly references?: string[];

  constructor(
    status: number,
    message: string,
    options: { fields?: Record<string, string>; references?: string[] } = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = options.fields;
    this.references = options.references;
  }
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  error?: string;
  fields?: Record<string, string>;
  references?: string[];
}

async function request<T>(
  path: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = 15_000, ...rest } = init;

  // AbortSignal.timeout is available in every browser we target and avoids
  // leaking a timer on success.
  const signal = rest.signal ?? AbortSignal.timeout(timeoutMs);

  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    ...rest,
    signal,
    headers: {
      ...(rest.body && !(rest.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...rest.headers,
    },
  });

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";
  const payload: Envelope<T> | null = contentType.includes("application/json")
    ? ((await response.json().catch(() => null)) as Envelope<T> | null)
    : null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error ?? `Request failed with status ${response.status}`,
      { fields: payload?.fields, references: payload?.references }
    );
  }

  return (payload?.data ?? (payload as unknown)) as T;
}

export const api = {
  get: <T>(path: string, init?: RequestInit & { timeoutMs?: number }) =>
    request<T>(path, { ...init, method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
