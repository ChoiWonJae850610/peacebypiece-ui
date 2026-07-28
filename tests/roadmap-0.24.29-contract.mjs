import assert from "node:assert/strict";
import fs from "node:fs";
import { assertHistoricalRoadmapContract } from "./helpers/wafl-historical-roadmap-contract.mjs";

const roadmap = fs.readFileSync("lib/internal/roadmap/roadmap-0.24.29.ts", "utf8");
const index = fs.readFileSync("lib/internal/roadmap/index.ts", "utf8");
const productRoadmap = fs.readFileSync("docs/productization-roadmap.md", "utf8");
const qa = fs.readFileSync("docs/qa/0.24.29-integrated-productization-checkpoint.md", "utf8");

assertHistoricalRoadmapContract("0.24.29", { nextVersion: "0.24.30" });
assert.match(roadmap, /version: "0\.24\.29"/);
assert.match(roadmap, /Integrated Productization Checkpoint/);
assert.match(roadmap, /status: "completed"/);
assert.match(roadmap, /PENDING_USER_QA/);
assert.match(roadmap, /0\.24\.30 Storage Capacity Profiles/);
assert.doesNotMatch(roadmap, /Storage Capacity Profiles implementation|quota race implementation|PG Billing implementation/);
assert.match(index, /ROADMAP_0_24_29/);
assert.match(productRoadmap, /0\.24\.29` - Integrated Productization Checkpoint/);
assert.match(roadmap, /not the previously listed historical Company-wide Export item/);
assert.match(qa, /PC Chrome/);
assert.match(qa, /iPhone Safari/);
assert.match(qa, /iPad Safari/);
assert.match(qa, /Role And Tenant Negative Checks/);

console.log("roadmap 0.24.29 contract passed");
