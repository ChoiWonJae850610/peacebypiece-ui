#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const catalog = fs.readFileSync(path.join(root, "lib/functions/catalog.ts"), "utf8");
const client = fs.readFileSync(path.join(root, "app/functions/FunctionsCatalogClient.tsx"), "utf8");
const pipeline = fs.readFileSync(path.join(root, "tools/pipeline/peacebypiece-auto-pipeline.ps1"), "utf8");

for (const id of ["PSU-0331-A01", "PSU-0331-A02", "PSU-0331-A03", "PSU-0331-A04", "PSU-0331-A05"]) {
  assert.ok(catalog.includes(id), `functions catalog missing public signup automation entry ${id}`);
}

for (const token of [
  "Public Signup",
  "System-admin Review",
  "Billing Readiness",
  "Responsive",
  "Authorization",
  "public-signup-authenticated-e2e",
  "tests/e2e/public-signup-authenticated.spec.mjs",
  "chromium-desktop",
  "webkit-desktop",
  "mobile-chromium",
  "mobile-webkit",
  "ipad-webkit",
  "MANUAL_REQUIRED",
]) {
  assert.ok(catalog.includes(token) || client.includes(token), `functions public signup automation metadata missing: ${token}`);
}

for (const token of [
  "64. Authenticated Public Signup E2E",
  "65. Public Signup Chromium E2E",
  "66. Public Signup Browser Matrix E2E",
  "67. Public Signup Deployed Smoke",
  "68. Public Signup Final Residual Audit",
  "69. Functions Automation Coverage Audit",
]) {
  assert.ok(pipeline.includes(token), `PowerShell menu missing: ${token}`);
}

console.log("[PASS] functions public signup automation contract");
