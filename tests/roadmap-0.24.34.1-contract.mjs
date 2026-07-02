#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const version = fs.readFileSync("lib/constants/version.ts", "utf8");
const index = fs.readFileSync("lib/internal/roadmap/index.ts", "utf8");
const roadmap = fs.readFileSync("lib/internal/roadmap/roadmap-0.24.34.1.ts", "utf8");
const currentState = fs.readFileSync("docs/codex-current-state.md", "utf8");
const productizationRoadmap = fs.readFileSync("docs/productization-roadmap.md", "utf8");
const verifySafe = fs.readFileSync("tools/pipeline/verify-safe.ps1", "utf8");

assert.match(version, /APP_VERSION = "0\.24\.34\.1"/);
assert.match(index, /ROADMAP_0_24_34_1/);
assert.match(index, /currentWorkVersion: "0\.24\.34\.1"/);
assert.match(index, /nextWorkVersion: "0\.24\.35"/);
assert.match(roadmap, /version: "0\.24\.34\.1"/);
assert.match(roadmap, /Public Signup First-Draft Flow Fix and Repo-state Metadata Correction/);
assert.match(roadmap, /0\.24\.35 - Company-wide Export Execution/);
assert.match(roadmap, /No DB migration for 0\.24\.34\.1/);
assert.match(roadmap, /Worker source change\/deploy/);
assert.match(currentState, /Current version: `0\.24\.34\.1`/);
assert.match(currentState, /Latest completed version: `0\.24\.34\.1`/);
assert.match(currentState, /0\.24\.35 implementation has not started/);
assert.match(productizationRoadmap, /Active baseline: `0\.24\.34\.1`/);
assert.match(productizationRoadmap, /0\.24\.35` Company-wide Export Execution/);
assert.match(verifySafe, /public-signup-first-draft-fix/);

console.log("roadmap 0.24.34.1 contract: OK");
