#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");

const version = read("lib/constants/version.ts");
const roadmap = read("lib/internal/roadmap/roadmap-0.24.34.2.ts");
const index = read("lib/internal/roadmap/index.ts");
const currentState = read("docs/codex-current-state.md");
const productization = read("docs/productization-roadmap.md");
const verifySafe = read("tools/pipeline/verify-safe.ps1");
const workflow = read("tools/pipeline/approved-workflow.ps1");
const pipeline = read("tools/pipeline/peacebypiece-auto-pipeline.ps1");

assert.match(version, /APP_VERSION = "0\.24\.34\.2"/);
assert.match(roadmap, /version: "0\.24\.34\.2"/);
assert.match(roadmap, /Customer-facing Product UX, System Catalog, Size Editing, and Workorder PDF Integration Cleanup/);
assert.match(roadmap, /status: "completed"/);
assert.match(roadmap, /0\.24\.35 Company-wide Export/);
assert.match(index, /ROADMAP_0_24_34_2/);
assert.match(index, /currentWorkVersion: "0\.24\.34\.2"/);
assert.match(index, /nextWorkVersion: "0\.24\.35"/);
assert.match(currentState, /0\.24\.34\.2/);
assert.match(productization, /0\.24\.34\.2/);
assert.match(productization, /0\.24\.35.*Company-wide Export Execution/);
assert.match(verifySafe, /customer-product-ux-cleanup/);
assert.match(workflow, /customer-product-ux-cleanup/);
assert.match(pipeline, /Product UX Language Audit/);
assert.match(pipeline, /Customer Product UX Cleanup Verification/);

console.log("roadmap 0.24.34.2 contract: PASS");
