#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");

const version = read("lib/constants/version.ts");
const roadmap = read("lib/internal/roadmap/roadmap-0.24.34.3.ts");
const index = read("lib/internal/roadmap/index.ts");
const currentState = read("docs/codex-current-state.md");
const productization = read("docs/productization-roadmap.md");
const verifySafe = read("tools/pipeline/verify-safe.ps1");
const workflow = read("tools/pipeline/approved-workflow.ps1");
const pipeline = read("tools/pipeline/peacebypiece-auto-pipeline.ps1");

assert.match(version, /APP_VERSION = "0\.24\.34\.3"/);
assert.match(roadmap, /version: "0\.24\.34\.3"/);
assert.match(roadmap, /Workorder PDF Live R2 Integration and Visual Verification/);
assert.match(roadmap, /status: "completed"/);
assert.match(roadmap, /0\.24\.35 Company-wide Export/);
assert.match(roadmap, /verifyGeneratedPdfObject|R2 read-back verification|previous-final preservation/);
assert.match(index, /ROADMAP_0_24_34_3/);
assert.match(index, /currentWorkVersion: "0\.24\.34\.3"/);
assert.match(index, /nextWorkVersion: "0\.24\.35"/);
assert.match(currentState, /0\.24\.34\.3/);
assert.match(productization, /0\.24\.34\.3/);
assert.match(productization, /0\.24\.35.*Company-wide Export Execution/);
assert.match(verifySafe, /workorder-pdf-live-integration/);
assert.match(workflow, /workorder-pdf-live-integration/);
assert.match(pipeline, /Workorder PDF Live R2 Integration/);
assert.doesNotMatch(`${roadmap}\n${currentState}\n${productization}`, /0\.24\.35[^]*implemented by 0\.24\.34\.3/i);

console.log("roadmap 0.24.34.3 contract: PASS");
