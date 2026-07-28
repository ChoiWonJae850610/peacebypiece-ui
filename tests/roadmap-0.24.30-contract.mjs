#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { assertHistoricalRoadmapContract } from "./helpers/wafl-historical-roadmap-contract.mjs";

const read = (file) => fs.readFileSync(file, "utf8");

const roadmap = read("lib/internal/roadmap/roadmap-0.24.30.ts");
const index = read("lib/internal/roadmap/index.ts");
const productRoadmap = read("docs/productization-roadmap.md");

assertHistoricalRoadmapContract("0.24.30", { nextVersion: "0.24.31" });
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

assert.match(productRoadmap, /0\.24\.30` - Storage Capacity Profiles/);
assert.match(roadmap, /0\.24\.31 - PG Billing and Subscription Operations/);
assert.match(roadmap, /Actual usage percent, display-clamped percent/);

console.log("roadmap 0.24.30 contract passed");
