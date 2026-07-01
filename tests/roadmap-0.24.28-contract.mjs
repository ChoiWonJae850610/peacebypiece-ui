#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const roadmap = fs.readFileSync("lib/internal/roadmap/roadmap-0.24.28.ts", "utf8");
const index = fs.readFileSync("lib/internal/roadmap/index.ts", "utf8");
const currentState = fs.readFileSync("docs/codex-current-state.md", "utf8");

assert.match(roadmap, /version: "0\.24\.28"/);
assert.match(roadmap, /PDF and R2 Lifecycle/);
assert.match(roadmap, /companies\/\{companyId\}\/workorders\/\{workOrderId\}\/pdf\/\{pdfId\}\.pdf/);
assert.match(roadmap, /prefix delete and bucket-wide cleanup/);
assert.match(roadmap, /Dev\/test Worker 0\.13\.71 deployment was confirmed/);
assert.match(roadmap, /status: "completed"/);
assert.match(roadmap, /PDF\/R2 lifecycle integration passed/);
assert.match(index, /ROADMAP_0_24_28/);
assert.match(index, /currentWorkVersion: "0\.24\.28"/);
assert.match(currentState, /Current version: `0\.24\.28`/);

console.log("roadmap 0.24.28 contract passed");
