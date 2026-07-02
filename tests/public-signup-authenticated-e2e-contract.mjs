#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const route = fs.readFileSync(path.join(root, "app/api/dev/public-signup-e2e/session/route.ts"), "utf8");
const helper = fs.readFileSync(path.join(root, "tests/e2e/helpers/publicSignupAuth.mjs"), "utf8");
const spec = fs.readFileSync(path.join(root, "tests/e2e/public-signup-authenticated.spec.mjs"), "utf8");
const config = fs.readFileSync(path.join(root, "playwright.config.mjs"), "utf8");

for (const token of [
  "isServerDevTestRuntime",
  "PUBLIC_SIGNUP_E2E_FIXTURE_BLOCKED",
  "createSignupApplicantSessionCookieValue",
  "createWaflSessionCookieValue",
  "cookieReturned: false",
  "httpOnly: true",
  "sameSite: \"lax\"",
  "public-signup-e2e",
]) {
  assert.ok(route.includes(token), `fixture route missing token: ${token}`);
}

for (const forbidden of [
  "process.env.WAFL_SESSION_SECRET",
  "GOOGLE_OAUTH_CLIENT_SECRET",
  "rawCookie",
]) {
  assert.ok(!route.includes(`return ${forbidden}`), `fixture route must not return secret/cookie: ${forbidden}`);
}

for (const token of [
  "createPublicSignupApplicantSession",
  "createPublicSignupSystemAdminSession",
  "createApprovedPublicSignupCompanyAdminSession",
  "clearPublicSignupFixtureSession",
  "expectNoRawPublicSignupSecrets",
  "PUBLIC_SIGNUP_E2E_FIXTURE_BLOCKED",
]) {
  assert.ok(helper.includes(token), `Playwright auth helper missing token: ${token}`);
}

for (const token of [
  "authenticated public signup QA automation",
  "applicant fixture",
  "system-admin fixture",
  "approved company-admin fixture",
  "public signup and invitation entry points remain separated",
]) {
  assert.ok(spec.includes(token), `authenticated E2E spec missing scenario: ${token}`);
}

for (const projectName of [
  "chromium-desktop",
  "webkit-desktop",
  "mobile-chromium",
  "mobile-webkit",
  "ipad-webkit",
]) {
  assert.ok(config.includes(projectName), `Playwright project missing: ${projectName}`);
}

assert.match(config, /trace:\s*"on-first-retry"/, "trace must be retained on first retry");
assert.match(config, /screenshot:\s*"only-on-failure"/, "screenshots must be failure-only");
assert.match(config, /video:\s*"retain-on-failure"/, "video must be retained on failure");

console.log("[PASS] public signup authenticated e2e contract");
