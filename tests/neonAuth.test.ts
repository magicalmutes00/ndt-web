import { test } from "node:test";
import assert from "node:assert/strict";
import { createLocalJWKSet, exportJWK, generateKeyPair, jwtVerify, SignJWT } from "jose";
import { looksLikeJwt, userFromClaims } from "../server/src/auth/neonAuth.js";

/**
 * Unit tests for token classification and claim extraction.
 *
 * Full verification runs end-to-end against the real Neon Auth service in
 * tests/neon.integration.test.ts. These tests pin the pure logic so a claim-shape
 * change upstream fails loudly here instead of silently logging everyone out.
 */

test("looksLikeJwt distinguishes a JWT from an opaque session token", () => {
  assert.equal(looksLikeJwt("aaa.bbb.ccc"), true);
  assert.equal(looksLikeJwt("opaque-session-token-with-no-dots"), false);
  assert.equal(looksLikeJwt("only.two"), false);
  assert.equal(looksLikeJwt(""), false);
  // Four segments is not a JWS compact serialization.
  assert.equal(looksLikeJwt("a.b.c.d"), false);
});

test("userFromClaims reads the standard Better Auth claims", () => {
  const user = userFromClaims({ sub: "user_123", email: "admin@example.com", name: "Admin" });
  assert.deepEqual(user, { id: "user_123", email: "admin@example.com", name: "Admin" });
});

test("userFromClaims falls back to a nested user object", () => {
  const user = userFromClaims({
    user: { id: "user_456", email: "nested@example.com", name: "Nested" },
  });
  assert.deepEqual(user, { id: "user_456", email: "nested@example.com", name: "Nested" });
});

test("userFromClaims returns null when identity is incomplete", () => {
  assert.equal(userFromClaims({ email: "no-sub@example.com" }), null);
  assert.equal(userFromClaims({ sub: "user_1" }), null);
  assert.equal(userFromClaims({}), null);
  // A non-string id must not be coerced into a user. Cast because a real JWT
  // payload is `unknown`-typed at the boundary; this models hostile input.
  const forged = { sub: 42, email: "x@example.com" } as unknown as Parameters<typeof userFromClaims>[0];
  assert.equal(userFromClaims(forged), null);
});

test("a signed EdDSA token verifies against the published key material", async () => {
  // Mirrors Neon Auth's published key type (EdDSA / Ed25519), so this fails if
  // that assumption ever stops holding.
  const { publicKey, privateKey } = await generateKeyPair("EdDSA", { crv: "Ed25519" });
  const jwk = await exportJWK(publicKey);
  assert.equal(jwk.kty, "OKP");
  assert.equal(jwk.crv, "Ed25519");

  const token = await new SignJWT({ email: "signed@example.com" })
    .setProtectedHeader({ alg: "EdDSA", kid: "test-key" })
    .setSubject("user_signed")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKey);

  assert.equal(looksLikeJwt(token), true);

  const { payload } = await jwtVerify(
    token,
    createLocalJWKSet({ keys: [{ ...jwk, kid: "test-key", alg: "EdDSA" }] })
  );

  const user = userFromClaims(payload as Record<string, unknown>);
  assert.equal(user?.id, "user_signed");
  assert.equal(user?.email, "signed@example.com");
});

test("a token signed by a different key is rejected", async () => {
  const signer = await generateKeyPair("EdDSA", { crv: "Ed25519" });
  const other = await generateKeyPair("EdDSA", { crv: "Ed25519" });
  const otherJwk = await exportJWK(other.publicKey);

  const token = await new SignJWT({ email: "attacker@example.com" })
    .setProtectedHeader({ alg: "EdDSA", kid: "other" })
    .setSubject("user_attacker")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(signer.privateKey);

  await assert.rejects(() =>
    jwtVerify(token, createLocalJWKSet({ keys: [{ ...otherJwk, kid: "other", alg: "EdDSA" }] }))
  );
});

test("an expired token is rejected", async () => {
  const { publicKey, privateKey } = await generateKeyPair("EdDSA", { crv: "Ed25519" });
  const jwk = await exportJWK(publicKey);

  const token = await new SignJWT({ email: "old@example.com" })
    .setProtectedHeader({ alg: "EdDSA", kid: "k" })
    .setSubject("user_old")
    .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
    .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
    .sign(privateKey);

  await assert.rejects(() =>
    jwtVerify(token, createLocalJWKSet({ keys: [{ ...jwk, kid: "k", alg: "EdDSA" }] }))
  );
});
