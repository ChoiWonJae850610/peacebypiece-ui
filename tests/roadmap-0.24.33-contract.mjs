#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const roadmap = fs.readFileSync("lib/internal/roadmap/roadmap-0.24.33.ts", "utf8");
const index = fs.readFileSync("lib/internal/roadmap/index.ts", "utf8");
const docs = fs.readFileSync("docs/productization-roadmap.md", "utf8");
const state = fs.readFileSync("docs/codex-current-state.md", "utf8");

for (const token of [
  "0.24.33",
  "Public Signup End-to-End UX and System-admin Review Operations",
  "Application-scoped signup payment-readiness",
  "dev/test readiness actions",
  "409 payment-readiness block",
]) {
  assert.ok(roadmap.includes(token), `roadmap missing token: ${token}`);
}
assert.match(roadmap, /actual PG integration false/i, "roadmap must keep actual PG integration false");
assert.match(roadmap, /actual email delivery false/i, "roadmap must keep actual email delivery false");

assert.ok(index.includes("ROADMAP_0_24_33"), "roadmap index must register 0.24.33");
assert.ok(index.includes("ROADMAP_0_24_33_1"), "roadmap index must register 0.24.33.1 follow-up");
assert.ok(index.includes('nextWorkVersion: "0.24.34"'), "roadmap index must set next work version");
assert.ok(docs.includes("0.24.33"), "productization roadmap docs must mention 0.24.33");
assert.ok(state.includes("0.24.33"), "current state must mention 0.24.33");
assert.ok(state.includes("Public Signup End-to-End UX"), "current state must describe the 0.24.33 scope");

console.log("roadmap 0.24.33 contract: OK");
