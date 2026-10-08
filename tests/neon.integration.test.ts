import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buildApp, prepareApp } from "../server/src/app.js";
import { config } from "../server/src/env.js";
import { closePool } from "../server/src/db/index.js";
import { cloneDefaultContent } from "../shared/content/defaultContent.js";
import type { SiteContent } from "../shared/content/schema.js";
import type { FastifyInstance } from "fastify";

/**
 * Integration tests against the real Neon database and Neon Auth service.
 *
 * Skipped entirely when the relevant configuration is absent, so the suite still
 * passes on a bare checkout. Tests that write to the database restore whatever
 * was published before the run.
 *
 * Authentication goes through the public sign-in proxy rather than by minting
 * tokens, so these tests cover the path a real admin takes. Set
 * TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD (an account created in Neon Auth) to
 * enable the authenticated cases.
 */

const hasDatabase = Boolean(config.databaseUrl);
const testEmail = process.env.TEST_ADMIN_EMAIL ?? "";
const testPassword = process.env.TEST_ADMIN_PASSWORD ?? "";
const hasCredentials = Boolean(testEmail && testPassword && config.neonAuth.url);

const describeDb = hasDatabase ? test : test.skip;
const describeAuth = hasCredentials ? test : test.skip;

let app: FastifyInstance;
let sessionCookie = "";

async function signIn(email: string, password: string) {
  return app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email, password },
  });
}

before(async () => {
  if (!hasDatabase) return;
  app = await buildApp({ logger: false });
  await prepareApp(app);

  if (hasCredentials) {
    const response = await signIn(testEmail, testPassword);
    if (response.statusCode === 200) {
      const cookie = response.cookies.find((entry) => entry.name === config.session.cookieName);
      if (cookie) sessionCookie = `${cookie.name}=${cookie.value}`;
    } else {
      console.error(
        `[integration] could not sign in as ${testEmail} (HTTP ${response.statusCode}): ` +
          `${response.body}. Authenticated tests will be skipped.`
      );
    }
  }
});

after(async () => {
  if (!hasDatabase) return;
  await app.close();
  await closePool();
});

/* -------------------------------------------------------------------------- */
/*                              database + content                            */
/* -------------------------------------------------------------------------- */

describeDb("the database is reachable and migrated", async () => {
  const response = await app.inject({ method: "GET", url: "/api/health" });
  assert.equal(response.statusCode, 200);

  const body = response.json();
  assert.equal(body.data.database.configured, true);
  assert.equal(body.data.database.reachable, true);
  assert.equal(body.data.auth.configured, Boolean(config.neonAuth.url));
});

describeDb("published content is served from the database", async () => {
  const response = await app.inject({ method: "GET", url: "/api/content" });
  assert.equal(response.statusCode, 200);

  const doc = response.json() as SiteContent;
  assert.equal(doc.version, 1);
  assert.ok(doc.collections.courses.length > 0);

  const meta = await app.inject({ method: "GET", url: "/api/content/meta" });
  assert.equal(meta.json().data.source, "database");
});

describeDb("the published document round-trips through jsonb intact", async () => {
  const publicDoc = (await app.inject({ method: "GET", url: "/api/content" })).json() as SiteContent;
  const expected = cloneDefaultContent();

  // Keys, not values: an admin may have edited the values since seeding.
  assert.deepEqual(Object.keys(publicDoc.collections).sort(), Object.keys(expected.collections).sort());
  assert.deepEqual(Object.keys(publicDoc.seo).sort(), Object.keys(expected.seo).sort());
  assert.equal(publicDoc.version, 1);
});

/* -------------------------------------------------------------------------- */
/*                        authentication failure modes                        */
/* -------------------------------------------------------------------------- */

describeDb("every admin route rejects anonymous callers with 401", async () => {
  const routes: { method: "GET" | "POST" | "PUT" | "DELETE"; url: string }[] = [
    { method: "GET", url: "/api/admin/content" },
    { method: "PUT", url: "/api/admin/content" },
    { method: "POST", url: "/api/admin/content/publish" },
    { method: "POST", url: "/api/admin/content/revert" },
    { method: "GET", url: "/api/admin/revisions" },
    { method: "POST", url: "/api/admin/revisions/1/restore" },
    { method: "GET", url: "/api/admin/media" },
    { method: "POST", url: "/api/media" },
    { method: "DELETE", url: "/api/admin/media/00000000-0000-0000-0000-000000000000" },
    { method: "GET", url: "/api/auth/me" },
  ];

  for (const route of routes) {
    const response = await app.inject(route);
    assert.equal(
      response.statusCode,
      401,
      `${route.method} ${route.url} returned ${response.statusCode}, expected 401`
    );
  }
});

describeDb("a forged session cookie is rejected", async () => {
  const response = await app.inject({
    method: "GET",
    url: "/api/admin/content",
    headers: { cookie: `${config.session.cookieName}=not-a-real-session-token` },
  });
  assert.equal(response.statusCode, 401);
});

describeDb("the sign-in proxy rejects wrong credentials with 401", async () => {
  const response = await signIn("definitely-not-a-user@example.invalid", "wrong-password-1234");
  assert.equal(response.statusCode, 401);
  const body = response.json();
  assert.equal(body.success, false);
  // Must not distinguish "unknown account" from "wrong password".
  assert.match(body.error, /incorrect/i);
});

describeDb("the sign-in proxy validates its input", async () => {
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email: "not-an-email", password: "" },
  });
  assert.equal(response.statusCode, 400);
});

/* -------------------------------------------------------------------------- */
/*                       authenticated dashboard flow                         */
/* -------------------------------------------------------------------------- */

describeAuth("the admin can sign in through the proxy and read the draft", async () => {
  assert.ok(sessionCookie, "expected a session cookie from the sign-in call");

  const response = await app.inject({
    method: "GET",
    url: "/api/admin/content",
    headers: { cookie: sessionCookie },
  });

  assert.equal(response.statusCode, 200, response.body);
  const data = response.json().data;
  assert.ok(data.draft, "expected a draft document");
  assert.ok(data.published, "expected a published document");
});

describeAuth("saving a draft does not change what the public sees", async () => {
  const before = (await app.inject({ method: "GET", url: "/api/content" })).json() as SiteContent;

  const draftResponse = await app.inject({
    method: "GET",
    url: "/api/admin/content",
    headers: { cookie: sessionCookie },
  });
  const { draft, draftVersion } = draftResponse.json().data as {
    draft: SiteContent;
    draftVersion: number;
  };

  const edited = structuredClone(draft);
  edited.settings.tagline = "Integration test tagline";

  const saved = await app.inject({
    method: "PUT",
    url: "/api/admin/content",
    headers: { cookie: sessionCookie },
    payload: { doc: edited, expectedVersion: draftVersion },
  });
  assert.equal(saved.statusCode, 200, saved.body);

  const after = (await app.inject({ method: "GET", url: "/api/content" })).json() as SiteContent;
  assert.equal(after.settings.tagline, before.settings.tagline);
});

describeAuth("an invalid draft is rejected with per-field errors", async () => {
  const draftResponse = await app.inject({
    method: "GET",
    url: "/api/admin/content",
    headers: { cookie: sessionCookie },
  });
  const { draft } = draftResponse.json().data as { draft: SiteContent };

  const broken = structuredClone(draft);
  broken.settings.email = "not-an-email";

  const response = await app.inject({
    method: "PUT",
    url: "/api/admin/content",
    headers: { cookie: sessionCookie },
    payload: { doc: broken, expectedVersion: null },
  });

  assert.equal(response.statusCode, 422);
  // The `doc.` prefix must be stripped so the form can map errors to fields.
  assert.ok(
    response.json().fields["settings.email"],
    `expected an unprefixed settings.email error, got ${response.body}`
  );
});

describeAuth("publishing promotes the draft, records a revision and refreshes the public doc", async () => {
  const original = (await app.inject({ method: "GET", url: "/api/content" })).json() as SiteContent;

  const draftResponse = await app.inject({
    method: "GET",
    url: "/api/admin/content",
    headers: { cookie: sessionCookie },
  });
  const { draft } = draftResponse.json().data as { draft: SiteContent };

  const marker = `Published by the integration test at ${new Date().toISOString()}`;
  const edited = structuredClone(draft);
  edited.settings.tagline = marker;

  await app.inject({
    method: "PUT",
    url: "/api/admin/content",
    headers: { cookie: sessionCookie },
    payload: { doc: edited, expectedVersion: null },
  });

  const published = await app.inject({
    method: "POST",
    url: "/api/admin/content/publish",
    headers: { cookie: sessionCookie },
    payload: { label: "integration test" },
  });
  assert.equal(published.statusCode, 200, published.body);
  assert.ok(published.json().data.revisionId, "expected a revision to be recorded");

  const publicDoc = (await app.inject({ method: "GET", url: "/api/content" })).json() as SiteContent;
  assert.equal(publicDoc.settings.tagline, marker);

  const revisions = await app.inject({
    method: "GET",
    url: "/api/admin/revisions",
    headers: { cookie: sessionCookie },
  });
  assert.ok(revisions.json().data.length > 0);

  // Restoring must only touch the draft.
  const revisionId = revisions.json().data[0].id as string;
  const restored = await app.inject({
    method: "POST",
    url: `/api/admin/revisions/${revisionId}/restore`,
    headers: { cookie: sessionCookie },
  });
  assert.equal(restored.statusCode, 200, restored.body);

  const stillPublished = (await app.inject({ method: "GET", url: "/api/content" })).json() as SiteContent;
  assert.equal(stillPublished.settings.tagline, marker);

  // Put the site back exactly as we found it.
  await app.inject({
    method: "PUT",
    url: "/api/admin/content",
    headers: { cookie: sessionCookie },
    payload: { doc: original, expectedVersion: null },
  });
  const restoredPublish = await app.inject({
    method: "POST",
    url: "/api/admin/content/publish",
    headers: { cookie: sessionCookie },
    payload: { label: "restored after integration tests" },
  });
  assert.equal(restoredPublish.statusCode, 200, restoredPublish.body);

  const final = (await app.inject({ method: "GET", url: "/api/content" })).json() as SiteContent;
  assert.equal(final.settings.tagline, original.settings.tagline);
});

describeAuth("signing out invalidates the browser session", async () => {
  const login = await signIn(testEmail, testPassword);
  assert.equal(login.statusCode, 200, login.body);
  const cookie = login.cookies.find((entry) => entry.name === config.session.cookieName)!;
  const header = `${cookie.name}=${cookie.value}`;

  const before = await app.inject({ method: "GET", url: "/api/auth/me", headers: { cookie: header } });
  assert.equal(before.statusCode, 200);

  await app.inject({ method: "POST", url: "/api/auth/logout", headers: { cookie: header } });

  const after = await app.inject({ method: "GET", url: "/api/auth/me", headers: { cookie: header } });
  assert.equal(after.statusCode, 401);
});
