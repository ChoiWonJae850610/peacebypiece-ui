import assert from "node:assert/strict";
import fs from "node:fs";

const version = fs.readFileSync("lib/constants/version.ts", "utf8");
const roadmap = fs.readFileSync("lib/internal/roadmap/roadmap-0.24.32.ts", "utf8");
const index = fs.readFileSync("lib/internal/roadmap/index.ts", "utf8");
const state = fs.readFileSync("docs/codex-current-state.md", "utf8");
const doc = fs.readFileSync("docs/productization-roadmap.md", "utf8");

assert.ok(version.includes('APP_VERSION = "0.24.32"'));
assert.ok(roadmap.includes('version: "0.24.32"'));
assert.ok(roadmap.includes("PG Billing and Subscription Operations"));
assert.ok(roadmap.includes("Actual PG provider selection"));
assert.ok(roadmap.includes("Actual external email delivery"));
assert.ok(roadmap.includes("db/migrations/patch_0_24_32_billing_operations.sql"));
assert.ok(index.includes("ROADMAP_0_24_32"));
assert.ok(index.includes('currentWorkVersion: "0.24.32"'));
assert.ok(index.includes('nextWorkVersion: "0.24.33"'));
assert.ok(state.includes("0.24.32"));
assert.ok(doc.includes("0.24.32 - PG Billing and Subscription Operations"));

console.log("roadmap 0.24.32 contract passed");
