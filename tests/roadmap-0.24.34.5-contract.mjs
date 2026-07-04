#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const roadmap = fs.readFileSync("lib/internal/roadmap/roadmap-0.24.34.5.ts", "utf8");
const index = fs.readFileSync("lib/internal/roadmap/index.ts", "utf8");
const version = fs.readFileSync("lib/constants/version.ts", "utf8");
const currentState = fs.readFileSync("docs/codex-current-state.md", "utf8");
const productizationRoadmap = fs.readFileSync("docs/productization-roadmap.md", "utf8");

for (const token of [
  'version: "0.24.34.5"',
  "Live Workorder, Signup, System UI, and PDF Review Checkpoint",
  "PRODUCT_QA_INCOMPLETE",
  "commit/push before user review",
  "0.24.35 Company-wide Export Execution",
  "PDF page PNG",
  "QA_Evidence",
  "Full Reset",
  "production DB/R2/Worker mutation",
  "destructive migration",
]) {
  assert.ok(roadmap.includes(token), `roadmap 0.24.34.5 missing ${token}`);
}

assert.match(index, /import \{ ROADMAP_0_24_34_5 \}/);
assert.match(index, /currentWorkVersion:\s*"0\.24\.34\.5"/);
assert.match(index, /nextWorkVersion:\s*"0\.24\.35"/);
assert.match(index, /ROADMAP_0_24_34_5/);
assert.match(version, /APP_VERSION\s*=\s*"0\.24\.34\.5"/);
assert.match(currentState, /Current version:\s*`0\.24\.34\.5`/);
assert.match(currentState, /PRODUCT_QA_INCOMPLETE/);
assert.match(productizationRoadmap, /APP_VERSION:\s*`0\.24\.34\.5`/);
assert.match(productizationRoadmap, /Live Workorder, Signup, System UI, and PDF Review Checkpoint/);

console.log("roadmap 0.24.34.5 contract: PASS");
