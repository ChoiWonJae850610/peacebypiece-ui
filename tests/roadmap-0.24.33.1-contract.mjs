#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const roadmap = fs.readFileSync("lib/internal/roadmap/roadmap-0.24.33.1.ts", "utf8");
const index = fs.readFileSync("lib/internal/roadmap/index.ts", "utf8");
const docs = fs.readFileSync("docs/productization-roadmap.md", "utf8");
const state = fs.readFileSync("docs/codex-current-state.md", "utf8");
const version = fs.readFileSync("lib/constants/version.ts", "utf8");

for (const token of [
  "0.24.33.1",
  "Authenticated Public Signup E2E and Deployed QA Automation",
  "Dev/test applicant, system-admin, and approved company-admin session fixture route",
  "Chromium, WebKit, mobile, and iPad Playwright project definitions",
  "Actual Google OAuth round-trip",
  "Actual PG integration false",
  "Actual email delivery false",
  "Worker changed false",
]) {
  assert.ok(roadmap.includes(token), `roadmap 0.24.33.1 missing token: ${token}`);
}

assert.ok(version.includes('APP_VERSION = "0.24.33.1"'), "APP_VERSION must be 0.24.33.1");
assert.ok(index.includes("ROADMAP_0_24_33_1"), "roadmap index must import/register 0.24.33.1");
assert.ok(index.includes('currentWorkVersion: "0.24.33.1"'), "roadmap index must set current work version");
assert.ok(index.includes('nextWorkVersion: "0.24.34"'), "roadmap index must keep next version 0.24.34");
assert.ok(docs.includes("0.24.33.1"), "productization roadmap doc must mention 0.24.33.1");
assert.ok(state.includes("0.24.33.1"), "current state must mention 0.24.33.1");
assert.ok(!roadmap.includes("0.24.34 implementation"), "0.24.33.1 roadmap must not start 0.24.34");

console.log("roadmap 0.24.33.1 contract: OK");
