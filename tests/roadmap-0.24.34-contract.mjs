#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const roadmap = fs.readFileSync("lib/internal/roadmap/roadmap-0.24.34.ts", "utf8");
const index = fs.readFileSync("lib/internal/roadmap/index.ts", "utf8");
const docs = fs.readFileSync("docs/productization-roadmap.md", "utf8");
const state = fs.readFileSync("docs/codex-current-state.md", "utf8");
const version = fs.readFileSync("lib/constants/version.ts", "utf8");

for (const token of [
  "0.24.34",
  "Workorder Size Specification and Incomplete/Final PDF",
  "Workorder size-set selection",
  "Incomplete workorder PDF",
  "Final workorder PDF",
  "0.24.35 - Company-wide Export Execution",
]) {
  assert.ok(roadmap.includes(token), `roadmap 0.24.34 missing token: ${token}`);
}

assert.ok(version.includes('APP_VERSION = "0.24.34"'), "APP_VERSION must be 0.24.34");
assert.ok(index.includes("ROADMAP_0_24_34"), "roadmap index must import/register 0.24.34");
assert.ok(index.includes('currentWorkVersion: "0.24.34"'), "roadmap index must set current work version");
assert.ok(index.includes('nextWorkVersion: "0.24.35"'), "roadmap index must set next version 0.24.35");
assert.ok(docs.includes("0.24.34"), "productization roadmap doc must mention 0.24.34");
assert.ok(state.includes("0.24.34"), "current state must mention 0.24.34");

console.log("roadmap 0.24.34 contract: OK");
