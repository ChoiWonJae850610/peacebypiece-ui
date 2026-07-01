#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");

const roadmap = read("lib/internal/roadmap/roadmap-0.24.30.ts");
const index = read("lib/internal/roadmap/index.ts");
const currentState = read("docs/codex-current-state.md");
const productRoadmap = read("docs/productization-roadmap.md");
const version = read("lib/constants/version.ts");

assert.match(version, /APP_VERSION = "0\.24\.30"/);
assert.match(roadmap, /version: "0\.24\.30"/);
assert.match(roadmap, /Storage Capacity Profiles/);
assert.match(roadmap, /status: "completed"/);
assert.match(roadmap, /Trial, Lite, Flow, Studio, and Custom storage\/member limits/);
assert.match(roadmap, /workorder attachment upload request/);
assert.match(roadmap, /generated PDF storage/);
assert.match(roadmap, /0%, <1%, 10%, 20%, 30%, 40%, 50%, 60%, 70%, 80%, 90%, 100%, and 110%/);
assert.match(roadmap, /PG Billing and Subscription Operations/);
assert.doesNotMatch(roadmap, /payment method implementation completed|raw card storage implemented|Kakao external API sending.*implemented/i);

assert.match(index, /ROADMAP_0_24_30/);
assert.match(index, /currentWorkVersion: "0\.24\.30"/);
assert.match(index, /nextWorkVersion: "0\.24\.31"/);

assert.match(currentState, /Current version: `0\.24\.30`/);
assert.match(currentState, /Next official version: `0\.24\.31` PG Billing and Subscription Operations/);
assert.match(currentState, /Trial: 100MB storage, 3 members/);
assert.match(currentState, /Workorder attachment upload target creation/);
assert.match(currentState, /Generated workorder PDF storage/);
assert.match(currentState, /DB migration this version: none/);

assert.match(productRoadmap, /Active baseline: `0\.24\.30`/);
assert.match(productRoadmap, /0\.24\.30` - Storage Capacity Profiles/);
assert.match(productRoadmap, /0\.24\.31` - PG Billing and Subscription Operations/);
assert.match(productRoadmap, /Usage data keeps actual percent separate from display-clamped percent/);

console.log("roadmap 0.24.30 contract passed");
