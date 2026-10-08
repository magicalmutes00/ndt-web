import { test } from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../server/src/app.js";

/**
 * Route-level smoke tests.
 *
 * These run with no DATABASE_URL set on purpose: the API is designed to boot and
 * serve the compiled fallback content in that state, and every /api/admin/*
 * route must still refuse anonymous callers before it ever touches the database.
 */

test("GET /api/health reports status and configuration", async () => {
  const app = await buildApp({ logger: false });
  try {
    const response = await app.inject({ method: "GET", url: "/api/health" });
    assert.equal(response.statusCode, 200);

    const body = response.json();
    assert.equal(body.success, true);
    assert.equal(typeof body.data.uptimeSeconds, "number");
    assert.equal(typeof body.data.database.configured, "boolean");
    assert.equal(typeof body.data.auth.configured, "boolean");
    // `null` when nothing is configured, otherwise the active backend's name.
    assert.ok(
      body.data.storage.provider === null ||
        body.data.storage.provider === "s3" ||
        body.data.storage.provider === "cloudinary",
      `unexpected storage provider: ${body.data.storage.provider}`
    );
  } finally {
    await app.close();
  }
});

test("GET /api/content serves the compiled default when no database is configured", async () => {
  const app = await buildApp({ logger: false });
  try {
    const response = await app.inject({ method: "GET", url: "/api/content" });
    assert.equal(response.statusCode, 200);

    const doc = response.json();
    assert.equal(doc.version, 1);
    assert.ok(doc.settings.name.length > 0);
    assert.ok(Array.isArray(doc.collections.courses));
    assert.ok(doc.collections.courses.length > 0);
    // Never leak the draft key through the public endpoint.
    assert.equal(doc.key, undefined);
  } finally {
    await app.close();
  }
});

test("public content responses carry an ETag and honour If-None-Match", async () => {
  const app = await buildApp({ logger: false });
  try {
    const first = await app.inject({ method: "GET", url: "/api/content" });
    const etag = first.headers.etag;
    assert.ok(etag, "expected an ETag header");

    const second = await app.inject({
      method: "GET",
      url: "/api/content",
      headers: { "if-none-match": String(etag) },
    });
    assert.equal(second.statusCode, 304);
  } finally {
    await app.close();
  }
});

test("every admin route rejects anonymous callers with 401", async () => {
  const app = await buildApp({ logger: false });
  try {
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
      assert.equal(response.json().success, false);
    }
  } finally {
    await app.close();
  }
});

test("login rejects a malformed body without hitting the database", async () => {
  const app = await buildApp({ logger: false });
  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "not-an-email", password: "" },
    });
    assert.equal(response.statusCode, 400);
    assert.equal(response.json().success, false);
  } finally {
    await app.close();
  }
});

test("unknown API routes return a JSON 404 rather than HTML", async () => {
  const app = await buildApp({ logger: false });
  try {
    const response = await app.inject({ method: "GET", url: "/api/does-not-exist" });
    assert.equal(response.statusCode, 404);
    assert.equal(response.json().success, false);
  } finally {
    await app.close();
  }
});

test("responses set the security headers", async () => {
  const app = await buildApp({ logger: false });
  try {
    const response = await app.inject({ method: "GET", url: "/api/health" });
    assert.equal(response.headers["x-content-type-options"], "nosniff");
    assert.ok(String(response.headers["content-security-policy"]).includes("frame-src"));
    // Cloudinary must be reachable for images to render.
    assert.ok(String(response.headers["content-security-policy"]).includes("res.cloudinary.com"));
  } finally {
    await app.close();
  }
});
