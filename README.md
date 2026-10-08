# NDT Institute & Services — website + admin dashboard

A React + TypeScript single-page site for an NDT training institute, plus a
password-protected dashboard that lets a non-technical admin edit **all** of the
site's content without a code change, rebuild or redeploy.

## Stack

| Layer | Choice |
|---|---|
| Front end | Vite 8 (rolldown) · React 19 · TypeScript 6 · react-router 7 |
| Styling | Tailwind 3.4 with a custom token layer (`primary` / `accent` / `steel`) |
| Motion | framer-motion 12 |
| 3D | three + @react-three/fiber + drei (hero and equipment scenes) |
| API | Node 24 · Fastify 5 · Zod 4 |
| Database | Neon Postgres (`@neondatabase/serverless`) |
| Media | Neon Object Storage (S3-compatible) · private bucket via an API proxy |
| Auth | Neon Auth (managed Better Auth) · server-side session verification |

## How content works

Content lives in one Zod-validated document, `SiteContent`, defined in
[`shared/content/schema.ts`](shared/content/schema.ts). That module is imported by
**both** the browser and the server, so the runtime validator and the TypeScript
type can never drift.

```
Browser ──GET /api/content──► Fastify ──► Neon (content.doc jsonb)
   ▲                              │
   └── /public/content.json ◄─────┘  (snapshot written on every publish)
```

The public site resolves content through four layers, so it renders complete
content even when the API or the database is down:

1. live `GET /api/content` (revalidated with an ETag)
2. the last good response cached in `localStorage`
3. `public/content.json`, rewritten on every publish
4. the compiled default in [`shared/content/defaultContent.ts`](shared/content/defaultContent.ts)

Editing is two-phase: changes save to a **draft** that visitors never see, and
**Publish** promotes it. Every publish snapshots the outgoing document into
`revisions`, so any earlier version can be restored — into the draft, never
straight to live.

## Running it locally

Requires Node 20+ (Node 24 recommended).

```bash
npm install
cp .env.example .env      # then fill in the blanks described below
npm run dev:all           # Vite on :3000 + API on :8787
```

Vite proxies `/api` to the API, so the browser only ever talks to one origin and
session cookies stay first-party.

| Script | Purpose |
|---|---|
| `npm run dev` | Vite only |
| `npm run dev:all` | Vite + API together |
| `npm run server` | API only, with reload |
| `npm run build` | `tsc -b && vite build` → `dist/` |
| `npm start` | Production API (serves `dist/` when `SERVE_STATIC=true`) |
| `npm run typecheck` | Types for the app, server and tests |
| `npm test` | Node's built-in test runner |
| `npm run lint` | oxlint |

### Environment variables

Only `DATABASE_URL` is required to serve the public site. Without
`NEON_AUTH_URL` the dashboard is disabled but the site still works. See
[`.env.example`](.env.example) for the annotated list.

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `NEON_AUTH_URL` | Neon Auth base URL (`https://ep-xxx.neonauth.…/neondb/auth`). Console → Branch → Auth → Configuration |
| `NEON_AUTH_ALLOWED_EMAILS` | Comma-separated allowlist. **Leave empty and any authenticated user can edit the site** — see the warning below |
| `NEON_AUTH_ADMIN_API_KEY` | Only for `/admin/*` user-management calls; not needed to run the dashboard |
| `NEON_AUTH_SESSION_CACHE_SECONDS` | How long a verified session is trusted before re-checking (default 30) |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Optional alternative storage backend |
| `AWS_ENDPOINT_URL_S3` / `AWS_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `S3_BUCKET` | Neon Object Storage (or any S3-compatible endpoint) |
| `S3_FOLDER` | Prefix for uploaded keys (default `uploads`) |
| `STORAGE_PROVIDER` | Force `s3` or `cloudinary`. Unset: S3 when configured, else Cloudinary |
| `COOKIE_SECURE` | Set `true` when serving over HTTPS |
| `PUBLIC_ORIGIN` | Origin forwarded to Neon Auth when a sign-in sends none (curl/scripts). **Must be a trusted domain** in the Neon Console |

Tables are created automatically on first boot (`schema_migrations` records what
was applied). There is no local user table: accounts, passwords, sessions and
password resets all live in Neon Auth, under its own `neon_auth` schema.

## Authentication

Sign-in is **proxied through this API**, not called directly from the browser.
That means:

- the Neon session token lands in an `HttpOnly`, first-party cookie and is never
  readable by JavaScript;
- the email allowlist is enforced server-side, where it cannot be bypassed;
- the browser never talks to a third-party origin, so no `SameSite=None` cookie
  or CORS preflight is involved.

Every protected request re-validates the token against Neon Auth (memoised for
`NEON_AUTH_SESSION_CACHE_SECONDS`), so revoking a session upstream takes effect
here without a restart. Two verification paths are supported, cheapest first:

1. **JWT + JWKS** — if the token is a JWT signed by Neon's Ed25519 key it is
   verified locally with no network round-trip. Enable the JWT plugin in the
   Neon Console to use this path.
2. **Session introspection** — `GET /get-session`. This is what the default
   email/password sign-in produces, and it is the path used out of the box.

### Two Neon Auth behaviours worth knowing

Both of these cost real debugging time, so they are pinned here:

- **Sign-in requires a trusted `Origin`.** Neon Auth answers
  `403 MISSING_OR_NULL_ORIGIN` when no `Origin` header is sent, and
  `403 INVALID_ORIGIN` for one that is not on the project's trusted-domain list.
  The API therefore forwards the caller's `Origin` (falling back to
  `PUBLIC_ORIGIN`), which means **the site's origin must be registered as a
  trusted domain in the Neon Console**. `http://localhost:3000` and
  `http://localhost:8787` are trusted by default.
- **`/get-session` wants the signed cookie, not the JSON token.**
  `/sign-in/email` responds with a 32-character `token`, but the session cookie
  it sets is `<token>.<signature>`. Introspecting with the bare token returns
  `null` — indistinguishable from an expired session. The API stores the full
  signed cookie value and replays it as a `Cookie` header, which is why sign-in
  succeeds where a token-only implementation silently 401s.

> **Security note.** With `NEON_AUTH_ALLOWED_EMAILS` empty, *anyone who can
> create an account through your Neon Auth endpoint can edit the site*. Either
> list the admin addresses explicitly, or disable public sign-up in the Neon
> Console. This is the single most important setting in this deployment.

### Creating the first admin

Accounts are managed in Neon Auth, not by this app. Either:

- **Neon Console** → your project → **Auth** → **Users** → create a user; or
- the admin API, which needs `NEON_AUTH_ADMIN_API_KEY`:

```bash
curl -X POST "$NEON_AUTH_URL/admin/create-user" \
  -H "x-api-key: $NEON_AUTH_ADMIN_API_KEY" \
  -H 'content-type: application/json' \
  -d '{"email":"you@example.com","password":"a-real-password","name":"Admin"}'
```

Then sign in at `/admin`. Email/password sign-in must be enabled in the Console;
if it is disabled, `/api/auth/login` returns 503 and the login screen reports an
unavailable service rather than a wrong password.

## Media and storage

Storage is pluggable behind one interface (`server/src/storage/`), selected by
configuration rather than code. S3 takes precedence when configured; Cloudinary
remains supported so a switch is an env change.

### How uploads work with S3

The bucket is **private**, which drives the whole design:

```
1. POST /api/media/presign   -> { uploadUrl, key, headers }   (session required)
2. browser PUTs the file directly to the bucket              (bytes never touch the API)
3. POST /api/media/confirm   -> HeadObject, then record the row
```

Reading is the interesting part. A presigned GET expires, so embedding one in
published content would leave every image broken once it lapsed. Instead uploads
store the object key and images are served from a **stable first-party URL**:

```
GET /api/media/file/uploads/<uuid>.png   -> streamed from the bucket
```

That route is public (these are marketing images) but keyed by an allowlist: only
objects recorded in the `media` table are ever served, so it cannot be used to
enumerate the bucket. Responses carry `Cache-Control: immutable`, which is safe
because keys are unique and never rewritten. The proxy does not exist for
Cloudinary, whose URLs are permanent and can be embedded directly.

Two traps worth knowing about, both covered by tests:

- **AWS SDK v3 checksums.** Since v3.729 the SDK attaches `x-amz-checksum-crc32`
  to presigned URLs, which a browser `fetch` PUT cannot satisfy — uploads fail
  with a 403. The client is configured with
  `requestChecksumCalculation: "WHEN_REQUIRED"` to keep presigned PUTs usable.
- **The SDK's `GetObject` body** is a Smithy `SdkStream`, not a Node stream.
  Wrapping it in `Readable.fromWeb` produces a 500; Fastify consumes it directly.

## Using the dashboard

Go to `/admin` and sign in. The dashboard is lazy-loaded, so its bundle is never
downloaded by public visitors.

- **Content** — every editable field, grouped into tabs. Adding or removing
  courses, services, testimonials, gallery images, nav links and footer columns
  needs no code: forms are generated from the schema plus the labels in
  [`shared/content/editorMeta.ts`](shared/content/editorMeta.ts).
- **Media** — upload images, copy a URL, delete. Deletion is refused while an
  image is still referenced in the content document; a forced delete is offered
  only after that refusal, and tells you where the image is used.
- **History** — restore any published revision into the draft.

Two people editing at once is safe: saves use optimistic concurrency, and the
second save gets a 409 telling the user to reload rather than silently clobbering
the first.

## Deployment

Both shapes are same-origin from the browser's perspective:

**A — one process.** `npm run build`, then run the API with `SERVE_STATIC=true`
and `NODE_ENV=production`. Fastify serves `/api/*` and the SPA from `dist/`,
including an SPA fallback for client routes.

**B — split.** API on a Node host (Render, Railway, Fly…), SPA on a static host,
with a reverse-proxy rewrite of `https://<site>/api/*` to the API host. Keep
sessions first-party: calling the API cross-origin instead requires
`SameSite=None; Secure` cookies plus a `CORS_ORIGINS` entry, and browsers with
third-party cookie blocking will reject the session. Prefer the rewrite.

Set `COOKIE_SECURE=true` and a real `SESSION_SECRET` in both cases.

## Project layout

```
src/
  admin/          dashboard (lazy entry: login, editor, media, history)
  components/     layout, sections, ui primitives (incl. the named icon registry)
  content/        client content store + provider/useContent
  pages/          one module per route
  lib/api.ts      fetch wrapper (same-origin, credentials included)
server/
  src/app.ts      Fastify factory, security headers, static + SPA hosting
  src/auth/       Neon Auth client, session middleware, sign-in proxy
  src/content/    published-document cache, ETag, snapshot emission
  src/media/      media routes: presign, confirm, private-bucket proxy
  src/storage/    provider contract + S3 and Cloudinary adapters
  src/db/         Neon pool, migrations, repositories
shared/content/   the Zod schema, compiled defaults and editor metadata
tests/            API, schema, JWT, storage and Neon integration tests
```

## Tests

```bash
npm test        # needs no configuration; integration parts self-skip
```

`tests/*.test.ts` runs against real Neon when `.env` is filled in, and skips the
database and authenticated cases otherwise. To exercise the authenticated
dashboard flow end to end, supply an account you created in Neon Auth:

```bash
TEST_ADMIN_EMAIL=you@example.com TEST_ADMIN_PASSWORD='…' npm test
```

Without those two variables, 5 tests skip and everything else (including the
"signed out users get 401 on every admin route" and "forged cookie is rejected"
checks) still runs.

`tests/storage.test.ts` performs a real upload → head → confirm → delete
round-trip against the configured bucket, and asserts that the presigned URL is
browser-usable (no checksum header required). It self-skips without S3 config.

## Known gaps

- **Contact and Apply forms are presentational.** They have no submit handler, so
  they deliver nothing. Wiring them up is separate work.
- `src/data/site.ts` is a deprecated shim that nothing imports. Delete it when
  convenient.
- Design tokens (colours, spacing, animation timings), page layout and component
  order are intentionally **not** admin-editable.
- Gallery images must be added to `public/images/gallery/` or uploaded through the
  Media tab. The built-in paths are placeholders and render a labelled fallback
  tile when the file is missing.
- `three` and the React vendor chunk exceed Vite's 300 kB warning limit. They are
  separate chunks, but the hero's 3D scene is still eagerly loaded; deferring it
  is tracked separately.
- The `login_attempts` table (our own lockout accounting) is the only auth-related
  data left in our schema.
